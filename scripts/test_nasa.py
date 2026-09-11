import earthaccess

print("Connecting to NASA Earthdata...")

auth = earthaccess.login()

if auth.authenticated:
    print("NASA Earthdata login successful!")
else:
    print("NASA Earthdata login failed.")