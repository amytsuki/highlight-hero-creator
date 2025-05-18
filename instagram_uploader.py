import requests

def upload_to_instagram(video_path, access_token, ig_user_id):
    video_url = f"https://graph-video.facebook.com/v17.0/{ig_user_id}/media"
    params = {
        "video_url": video_path, # URL of the video to upload
        "caption": "Posted via AI backend!",
        "access_token": access_token
    }
    res = requests.post(video_url, data=params)
    container_id = res.json().get("id")

    if not container_id:
        raise Exception("Error creating container", res.text)

    publish_url = f"https://graph.facebook.com/v17.0/{ig_user_id}/media_publish"
    res = requests.post(publish_url, data={
        "creation_id": container_id,
        "access_token": access_token
    })

    if res.status_code != 200:
        raise Exception("Error publishing video", res.text)

    return res.json()
