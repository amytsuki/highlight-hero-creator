from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.oauth2 import service_account

def upload_to_youtube(video_path, title, description, credentials_json):
    scopes = ["https://www.googleapis.com/auth/youtube.upload"]
    credentials = service_account.Credentials.from_service_account_file(
        credentials_json, scopes=scopes
    )

    youtube = build("youtube", "v3", credentials=credentials)

    request = youtube.videos().insert(
        part="snippet,status",
        body={
            "snippet": {
                "title": title,
                "description": description,
                "tags": ["AI", "Video", "Generated"],  # хэштеги
                "categoryId": "22"  # People & Blogs
            },
            "status": {
                "privacyStatus": "unlisted"
            }
        },
        media_body=MediaFileUpload(video_path)
    )

    response = request.execute()
    return response["id"]
