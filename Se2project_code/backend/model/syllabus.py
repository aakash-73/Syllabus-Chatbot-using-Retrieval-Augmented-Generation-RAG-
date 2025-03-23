from mongoengine import Document, StringField

class Syllabus(Document):
    course_id = StringField(required=True)
    course_name = StringField(required=True)
    department_id = StringField(required=True)
    department_name = StringField(required=True)
    syllabus_description = StringField(required=True)
    syllabus_pdf = StringField(required=True)  # This stores the GridFS file ID
    uploaded_by = StringField(required=True)

    meta = {'collection': 'syllabi'}