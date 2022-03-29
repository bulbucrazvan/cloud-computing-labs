from datetime import datetime
import logging
import os

from flask import Flask, redirect, render_template, request, Response

from google.cloud import datastore

CLOUD_STORAGE_BUCKET = "helloworld-345010"


app = Flask(__name__)

@app.route("/register", methods=["POST"])
def register():
    credentials = request.json
    datastore_client = datastore.Client()
    key = datastore_client.key("Users")
    new_user = datastore.Entity(key)
    new_user.update({
        "email": credentials["email"],
        "country": credentials["country"]
    })
    datastore_client.put(new_user)
    return Response(status=201)




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

if __name__ == "__main__":
    # This is used when running locally. Gunicorn is used to run the
    # application on Google App Engine. See entrypoint in app.yaml.
    app.run(host="127.0.0.1", port=8080, debug=True)
