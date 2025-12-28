from flask import Flask, render_template, request, jsonify, send_file
import openai
import os
import numpy as np
import pandas as pd
from datetime import datetime

game_events = []

openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("game.html")

@app.route("/ai_hint", methods=["POST"])
def ai_hint():
    data = request.json

    kid1_x = data["kid1_x"]
    kid2_x = data["kid2_x"]
    star_x = data["star_x"]
    canvas_width = data["canvas_width"]

    # ================= NUMPY LOGIC (PRIMARY) =================

    d1 = star_x - kid1_x
    d2 = star_x - kid2_x

    def move_hint(dist):
        if abs(dist) < 25:
            return "stay where you are"
        return "move right" if dist > 0 else "move left"

    kid1_hint = move_hint(d1)
    kid2_hint = move_hint(d2)

    # Base hint (always works, even if OpenAI fails)
    hint_text = f"Luv should {kid1_hint}. Nathan should {kid2_hint}."

    # ================= OPTIONAL OPENAI ENHANCEMENT =================
    try:
        prompt = f"""
        Luv is at {kid1_x}, Nathan is at {kid2_x}.
        Star is at {star_x} on a canvas of width {canvas_width}.
        Improve this hint in a fun way:
        "{hint_text}"
        """

        resp = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6
        )

        hint_text = resp.choices[0].message.content.strip()

    except Exception as e:
        print("OpenAI fallback used:", e)
        # NumPy-based hint remains

    return jsonify({"hint": hint_text})

@app.route("/game_event", methods=["POST"])
def game_event():
    data = request.json
    game_events.append(data)
    return {"status": "ok"}

@app.route("/game_report")
def game_report():
    if not game_events:
        return {"message": "No data yet"}

    df = pd.DataFrame(game_events)

    report = {
        "total_events": len(df),
        "kid1_catches": (df["player"] == "kid1").sum(),
        "kid2_catches": (df["player"] == "kid2").sum(),
        "avg_kid1_position": float(df["kid1_x"].mean()),
        "avg_kid2_position": float(df["kid2_x"].mean())
    }

    return report

@app.route("/export_csv")
def export_csv():
    df = pd.DataFrame(game_events)
    df.to_csv("game_data.csv", index=False)
    return {"message": "CSV exported"}

@app.route("/save_stats", methods=["POST"])
def save_stats():
    data = request.json
    save_game_stats(
        data["luv"],
        data["nathan"]
    )
    return {"status": "ok"}


@app.route("/download_stats")
def download_stats():
    csv_path = "game_stats.csv"

    # Create file if it doesn't exist
    if not os.path.exists(csv_path):
        df = pd.DataFrame(columns=[
            "timestamp",
            "luv_score",
            "nathan_score",
            "winner",
            "duration_sec"
        ])
        df.to_csv(csv_path, index=False)

    return send_file(
        csv_path,
        as_attachment=True,
        download_name="quicknoteai_game_stats.csv",
        mimetype="text/csv"
    )

def save_game_stats(luv, nathan, duration=60):

    csv_path = "game_stats.csv"

    winner = (
        "Luv" if luv > nathan else
        "Nathan" if nathan > luv else
        "Tie"
    )

    new_row = {
        "timestamp": datetime.now().isoformat(),
        "luv_score": luv,
        "nathan_score": nathan,
        "winner": winner,
        "duration_sec": duration
    }

    try:
        df = pd.read_csv(csv_path)
    except FileNotFoundError:
        df = pd.DataFrame(columns=new_row.keys())

    df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
    df.to_csv(csv_path, index=False)


if __name__ == "__main__":
    app.run(debug=True)