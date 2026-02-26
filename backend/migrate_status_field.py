from model.user import User

for user in User.objects():
    if not hasattr(user, 'status'):
        user.status = "approved" 
        user.save()

print("Migration completed.")
