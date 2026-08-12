import os
import io
import base64
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import face_recognition
import numpy as np
from PIL import Image

app = FastAPI(title="Smart Attendance CV Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RecognizeRequest(BaseModel):
    image_base64: str

# In a production app, these encodings would be stored in a database
# For this implementation, we will load them from a local directory
FACES_DIR = os.path.join(os.path.dirname(__file__), "data", "faces")
known_face_encodings = []
known_face_names = []

def load_known_faces():
    global known_face_encodings, known_face_names
    known_face_encodings = []
    known_face_names = []
    
    if not os.path.exists(FACES_DIR):
        os.makedirs(FACES_DIR)
        print(f"Created faces directory at {FACES_DIR}")
        return

    for filename in os.listdir(FACES_DIR):
        if filename.endswith(('.png', '.jpg', '.jpeg')):
            # The filename should be the employee ID or code, e.g., "EMP001.jpg"
            name = os.path.splitext(filename)[0]
            filepath = os.path.join(FACES_DIR, filename)
            
            try:
                image = face_recognition.load_image_file(filepath)
                # Ensure at least one face is found
                encodings = face_recognition.face_encodings(image)
                if encodings:
                    known_face_encodings.append(encodings[0])
                    known_face_names.append(name)
                    print(f"Loaded face for {name}")
                else:
                    print(f"No face found in {filename}")
            except Exception as e:
                print(f"Error loading {filename}: {e}")

@app.on_event("startup")
async def startup_event():
    load_known_faces()

@app.post("/recognize")
async def recognize_face(request: RecognizeRequest):
    try:
        # Decode base64 image (typically comes as data:image/jpeg;base64,...)
        encoded_data = request.image_base64
        if ',' in encoded_data:
            encoded_data = encoded_data.split(',')[1]
            
        image_bytes = base64.b64decode(encoded_data)
        image = face_recognition.load_image_file(io.BytesIO(image_bytes))
        
        # Find all faces in the uploaded image
        face_locations = face_recognition.face_locations(image)
        face_encodings = face_recognition.face_encodings(image, face_locations)
        
        if not face_encodings:
            raise HTTPException(status_code=400, detail="No face detected in the image")
            
        # We assume only one person is checking in at a time
        unknown_face_encoding = face_encodings[0]
        
        if len(known_face_encodings) == 0:
            raise HTTPException(status_code=400, detail="No enrolled faces in the system")
            
        # Compare against known faces
        matches = face_recognition.compare_faces(known_face_encodings, unknown_face_encoding)
        face_distances = face_recognition.face_distance(known_face_encodings, unknown_face_encoding)
        
        best_match_index = np.argmin(face_distances)
        if matches[best_match_index]:
            employee_code = known_face_names[best_match_index]
            return {"success": True, "employeeCode": employee_code, "confidence": 1.0 - face_distances[best_match_index]}
        else:
            return {"success": False, "message": "Face not recognized"}
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Recognition error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reload")
async def reload_faces():
    load_known_faces()
    return {"message": f"Reloaded {len(known_face_names)} faces"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
