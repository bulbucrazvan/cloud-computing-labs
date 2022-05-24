from datetime import datetime
import json
import logging
import os
import requests
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from flask import Flask, redirect, render_template, request, Response, jsonify
from flask_cors import CORS

from google.cloud import datastore


CLOUD_STORAGE_BUCKET = os.environ.get('CLOUD_STORATE_BUCKET')
WEATHER_API_KEY = os.environ.get('WEATHER_API_KEY')
SENDGRID_KEY = os.environ.get('SENDGRID_KEY')
app = Flask(__name__)
CORS(app)

@app.route("/register", methods=["POST"])
def register():
    credentials = request.json
    if not ("email" in credentials and "subscribeToEmails" in credentials):
        return Response(status=400)
    datastore_client = datastore.Client(CLOUD_STORAGE_BUCKET)
    user = get_user(datastore_client, credentials["email"])
    if user:
        return Response(status=409)
    key = datastore_client.key("Users")
    new_user = datastore.Entity(key)
    new_user.update({
        "email": credentials["email"],
        "subscribeToEmails": credentials["subscribeToEmails"],
        "locations": []
    })
    datastore_client.put(new_user)
    return Response(status=201)

@app.route("/subscriptionStatus", methods=["GET"])
def get_subscription_status():
    email = request.args.get("email")
    if not email:
        return Response(status=400)
    datastore_client = datastore.Client(CLOUD_STORAGE_BUCKET)
    user = get_user(datastore_client, email)
    if not user:
        return Response(status=404)
    return jsonify({"subscriptionStatus": user["subscribeToEmails"]})

@app.route("/subscriptionStatus", methods=["PATCH"])
def change_subscription_status():
    credentials = request.json
    if not ("email" in credentials):
        return Response(status=400)
    datastore_client = datastore.Client(CLOUD_STORAGE_BUCKET)
    user = get_user(datastore_client, credentials["email"])
    if not user:
        return Response(status=404)
    user["subscribeToEmails"] = not user["subscribeToEmails"]
    datastore_client.put(user)
    return Response(status=200)

@app.route("/subscriptionLocation", methods=["GET"])
def get_locations():
    email = request.args.get("email")
    if not email:
        return Response(status=400)
    datastore_client = datastore.Client(CLOUD_STORAGE_BUCKET)
    user = get_user(datastore_client, email)
    if not user:
        return Response(status=404)
    return jsonify(user["locations"])

@app.route("/subscriptionLocation", methods=["POST"])
def add_location():
    if not ("email" in request.json and "latitude" in request.json and "longitude" in request.json):
        return Response(status=400)
    lat, long, email = request.json["latitude"], request.json["longitude"], request.json["email"]
    datastore_client = datastore.Client(CLOUD_STORAGE_BUCKET)
    user = get_user(datastore_client, email)
    if not user:
        return Response(status=404)
    request_params = { "appid": WEATHER_API_KEY, "lat": lat, "lon": long, "limit": 1 }
    api_response = requests.get("http://api.openweathermap.org/geo/1.0/reverse", params=request_params).json()
    location_name, location_country = api_response[0]["name"], api_response[0]["country"]
    if len(list(filter(lambda location: location["name"] == location_name and location["country"] == location_country ,user["locations"]))) > 0:
        return Response(status=409)
    user["locations"].append({"lat": lat, "long": long, "name": location_name, "country": location_country})
    datastore_client.put(user)
    return Response(status=200)

@app.route("/subscriptionLocation", methods=["DELETE"])
def remove_location():
    if not ("email" in request.json and "latitude" in request.json and "longitude" in request.json):
        return Response(status=400)
    lat, long, email = request.json["latitude"], request.json["longitude"], request.json["email"]
    datastore_client = datastore.Client(CLOUD_STORAGE_BUCKET)
    user = get_user(datastore_client, email)
    if not user:
        return Response(status=404)
    user["locations"][:] = [location for location in user["locations"] if not (location["lat"] == lat and location["long"] == long)]
    datastore_client.put(user)
    return Response(status=200)

@app.route("/forecast")
def get_forecast():
    lat, long, units = request.args.get("latitude"), request.args.get("longitude"), request.args.get("units")
    if not (lat and long):
        return Response(status=400)
    request_params = { "appid": WEATHER_API_KEY, "lat": lat, "lon": long, "units": units }    
    api_response = requests.get("https://api.openweathermap.org/data/2.5/weather", params=request_params)
    data = api_response.json()
    return jsonify(get_forecast_data(lat, long, units))

@app.route("/emails")
def send_emails():
    datastore_client = datastore.Client(CLOUD_STORAGE_BUCKET)
    query = datastore_client.query(kind="Users")
    query.add_filter("subscribeToEmails", "=", True)
    result = list(query.fetch())
    for user in result:
        if user["locations"]:
            send_email(user["email"], get_email_data(user["locations"]))
    return jsonify(result)

@app.errorhandler(500)
def server_error(e):
    logging.exception("An error occurred during a request.")
    return (
        """
    An internal error occurred: <pre>{}</pre>
    See logs for full stacktrace.
    """.format(
            e
        ),
        500,
    )

def get_user(datastore_client: datastore.Client, user):
    query = datastore_client.query(kind="Users")
    query.add_filter("email", "=", user)
    result = list(query.fetch())
    print(result)
    return list(result)[0] if len(result) > 0 else None

def get_forecast_data(lat, long, units):
    request_params = { "appid": WEATHER_API_KEY, "lat": lat, "lon": long, "units": units }    
    api_response = requests.get("https://api.openweathermap.org/data/2.5/weather", params=request_params)
    data = api_response.json()
    response = {
        "location": {
            "name": data["name"],
            "country": data["sys"]["country"]
        },
        "weather": {
            "description": data["weather"][0]["description"],
            "degrees": {
                "temp": data["main"]["temp"],
                "temp_max": data["main"]["temp_max"],
                "temp_min": data["main"]["temp_min"],
                "feels_like": data["main"]["feels_like"]
            },
            "wind": {
                "gust": data["wind"].get("gust") or None,
                "speed": data["wind"].get("speed") or None
            }
        },
        
    }
    return response

def send_email(to_email, data):
    message = Mail(
    from_email='bookaggregateshop@gmail.com',
    to_emails=to_email,
    subject='Daily Weather Forecast',
    html_content=data)
    try:
        sg = SendGridAPIClient(SENDGRID_KEY)
        sg.send(message)
    except Exception as e:
        print(e.message)

def get_email_data(user_locations):
    data_string = "<ul>"
    for location in user_locations:
        forecast = get_forecast_data(location["lat"], location["long"], "metric")
        data_string += f'<li>{location["name"]}, {location["country"]}: {forecast["weather"]["degrees"]["temp"]}C, {forecast["weather"]["description"]}</li>\n'
    data_string += "</ul>"
    return data_string

if __name__ == "__main__":
    # This is used when running locally. Gunicorn is used to run the
    # application on Google App Engine. See entrypoint in app.yaml.
    app.run(host="127.0.0.1", port=8080, debug=True)