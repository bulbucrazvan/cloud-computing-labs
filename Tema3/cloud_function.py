from __future__ import print_function

import os.path
import os
import base64
import json
from flask import Response

import functions_framework
from google.auth.transport.requests import Request
from google.oauth2.service_account import Credentials
from google.cloud import datastore
from google.cloud import bigquery
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from email.mime.text import MIMEText
import google.oauth2.credentials



# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def get_forecast(country):
  client = bigquery.Client()
  query = """ 
    WITH
  boundary AS (
  SELECT
    layer_class,
    layer_name,
    all_tags,
    geometry
  FROM
    `bigquery-public-data.geo_openstreetmap.planet_layers` AS layers
  WHERE
    TRUE
    AND layer_class = 'boundary'
    AND layer_name = 'national'
    AND EXISTS (
    SELECT
      1
    FROM
      layers.all_tags
    WHERE
      key = 'ISO3166-1'
      AND value IN ('""" + country + """')) ),

  cells AS (
  SELECT
    gfs.*
  FROM
    boundary,
    `bigquery-public-data.noaa_global_forecast_system.NOAA_GFS0P25` AS gfs
  WHERE
    creation_time = '2022-03-28'
    AND ST_WITHIN(gfs.geography,
      boundary.geometry) ),

  pred1 AS (
  SELECT
    time,
    AVG(temperature_2m_above_ground) AS temp
  FROM
    cells
  JOIN
    UNNEST(forecast) AS forecast
  WHERE
    MOD(hours,24) = 0
    AND time = '2022-03-28'
  GROUP BY
    creation_time,
    time )

SELECT
  *
FROM
  pred1
ORDER BY
  time ASC
  """
  query_job = client.query(query)
  rows = query_job.result()
  data = ""
  for row in rows:
    data += "Time: " + str(row["time"]) + "; Temperature: " + str(row["temp"]) + "\n"
  print(data)
  return data


def create_message(sender, to, subject, message_text):
  message = MIMEText(message_text)
  message['to'] = to
  message['from'] = sender
  message['subject'] = subject
  b64_bytes = base64.urlsafe_b64encode(message.as_bytes())
  b64_string = b64_bytes.decode()
  body = {'raw': b64_string}
  return body

def send_message(service, user_id, message):
  try:
    message = (service.users().messages().send(userId=user_id, body=message)
               .execute())
    print('Message Id: %s' % message['id'])
    return message
  except HttpError as error:
    print('An error occurred: %s' % error)

def send_emails(request):
    datastore_client = datastore.Client()
    query = datastore_client.query(kind="oAuthKey")
    results = query.fetch()
    results = list(results)
    info = dict(results[0])
    #key_info = info["key"]["key"]
    creds = google.oauth2.credentials.Credentials(
    'ya29.A0ARrdaM8gpZfj4I1SSvRRNWDSTqrmQkki4iOP7dGPFogixKWaM-i9gBQ6uCRk6syi9IXEeU5XIrVwFiXOVbUE2iXswnep5s0xeB7X7JWttAv2VX_H-pNRnH41_t2xAUN8jlGdPzAI7ZLc8-CKuE0NpvRtx1Lb')
    query = datastore_client.query(kind="Users")
    users = list(query.fetch())
    for user in users:
      try:
        # Call the Gmail API
        user_dict = dict(user)
        user_email = user_dict["email"]
        user_country = user_dict["country"]
        user_forecast = get_forecast(user_country)
        service = build('gmail', 'v1', credentials=creds)
        message = create_message("rbulbuc1@gmail.com", user_email, "CCTema3", user_forecast)
        send_message(service, "rbulbuc1@gmail.com", message)
        return Response(status=200)
      except HttpError as error:
        # TODO(developer) - Handle errors from gmail API.
        print(f'An error occurred: {error}')
        return Response(status=500)

    
