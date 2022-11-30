from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse
import fastapi.responses as _responses
from fastapi.templating import Jinja2Templates
import sqlite3, os

#creates an instance of fastapi for the webpage to run in
app = FastAPI()

#creates an instance of jinja templates to be user elsewhere
templates = Jinja2Templates(directory="")

#takes a file path and an sql command and executes the command on the correct database
def getDetails(file_path, cursor_command):
    connection = sqlite3.connect(file_path)

    #creates a cursor and executes SQL command to select the chosen data for a given ammo name
    cursor = connection.cursor()
    extracted_data = cursor.execute(cursor_command)
    data = extracted_data.fetchall()

    #closes the connection to the file
    connection.commit()
    connection.close()
    
    return data

#updates a row to the database given the file and list of all the relevant data
def updateDetails(file_path, cursor_command):
    connection = sqlite3.connect(file_path)

    #creates a cursor and executes SQL command to select the chosen data for a given ammo name
    cursor = connection.cursor()
    cursor.execute(cursor_command)

    #closes the connection to the file
    connection.commit()
    connection.close()
    
    return True

#adds a row to the database given the file and list of all the relevant data
def AddRow(file_name, cursor_command, details):
    #connects to the given file
    connection = sqlite3.connect(file_name)

    #creates a cursor and executes SQL command to insert the given data into the table as a new row
    cursor = connection.cursor()
    cursor.execute(cursor_command, details)

    #closes the connection to the file
    connection.commit()
    connection.close()
    
    return True

#gets either shipping or billing data
def getDataDict(dict_type):
    
    #gets users customer id
    cursor_command = cursor_get_commands["get_customer_id"] + "'" + username + "';"
    customer_id = getDetails(file_names["accounts"], cursor_command)[0][0]     
    
    #gets users shipping data
    if dict_type == "shipping":

        cursor_command = cursor_get_commands["get_shipping_data"] + str(customer_id)
        shipping_data = getDetails(file_names["shipping_details"], cursor_command)[0]
        shipping_details = {
            "recipient": shipping_data[0],
            "address": shipping_data[1],
            "postcode": shipping_data[2],
            "country": shipping_data[3]
            }
        
        return shipping_details
    
    #gets users billing data
    elif dict_type == "billing":
        
        #gets users account id
        cursor_command = cursor_get_commands["get_account_id"] + "'" + username + "';"
        account_id = getDetails(file_names["accounts"], cursor_command)[0][0]
        
        #gets users payment method
        try:
            cursor_command = cursor_get_commands["get_payment_method"] + str(account_id)
            payment_method = getDetails(file_names["invoices"], cursor_command)[0][0]
        except:
            payment_method = "NOT YET DEFINED"
        
        cursor_command = cursor_get_commands["get_billing_data"] + str(customer_id)
        billing_data = getDetails(file_names["billing_details"], cursor_command)[0]
        billing_details = {
            "recipient": billing_data[0],
            "address": billing_data[1],
            "postcode": billing_data[2],
            "country": billing_data[3],
            "payment_method": payment_method
            }
        
        return billing_details
    


#finds the current directory the program is running in
file_dir = os.path.dirname(os.path.realpath(__file__))
    
#defines the file paths for all the needed databases to make it easier to use later
file_names = {"accounts"         : file_dir + "\databases\Accounts.db",
              "shipping_details" : file_dir + "\databases\Shipping_Details.db",
              "billing_details"  : file_dir + "\databases\Billing_Details.db",
              "invoices"         : file_dir + "\databases\Invoices.db",
              "orders"           : file_dir + "\databases\Orders.db",
              "order_product"    : file_dir + "\databases\Order_Product.db",
              "inventory"        : file_dir + "\databases\Inventory.db"}

#defines the some SELECT sql commands in order to make it easier to call them later
cursor_get_commands = {"get_all_emails"                : ("SELECT Email FROM Accounts"),
                       "get_email"                     : ("SELECT Email FROM Accounts WHERE Username = "),
                       "get_password"                  : ("SELECT Password FROM Accounts WHERE Username = "),
                       "get_account_id"                : ("SELECT Account_ID FROM Accounts WHERE Username = "),
                       "get_account_type"              : ("SELECT Account_Type FROM Accounts WHERE Username = "),
                       "get_username"                  : ("SELECT Username FROM Accounts WHERE Email = "),
                       "get_full_name"                 : ("SELECT Full_Name FROM Accounts WHERE Username = "),
                       "get_customer_id"               : ("SELECT Customer_ID FROM Accounts WHERE Username = "),
                       "get_billing_data"              : ("SELECT Billing_Name, Billing_Address, Billing_Postcode, Billing_Country FROM Billing_Details WHERE Customer_ID = "),
                       "get_shipping_data"             : ("SELECT Shipping_Name, Shipping_Address, Shipping_Postcode, Shipping_Country FROM Shipping_Details WHERE Customer_ID = "),
                       "get_payment_method"            : ("SELECT Payment_Method FROM Invoices WHERE Account_ID = ")    
                   }

#defines the some SELECT sql commands in order to gather all data in a table to make it easier to call them later
cursor_display_commands = {"accounts"         : ("SELECT * FROM Accounts"),
                           "shipping_details" : ("SELECT * FROM Shipping_Details"),
                           "billing_details"  : ("SELECT * FROM Billing_Details"),
                           "invoices"         : ("SELECT * FROM Invoices"),
                           "orders"           : ("SELECT * FROM Orders"),
                           "order_product"    : ("SELECT * FROM Order_Product"),
                           "inventory"        : ("SELECT * FROM Inventory")}

#defines the some UPDATE sql commands in order to make it easier to call them later
cursor_update_commands = {"update_billing_data"      : ("UPDATE Billing_Details SET "),
                          "update_shipping_data"     : ("UPDATE Shipping_Details SET "),
                          "update_email"             : ("UPDATE Accounts SET Email = ") 
                          }

#defines the some INSERT sql commands in order to make it easier to call them later
cursor_add_commands = {"new_account"  : ("""INSERT INTO Accounts VALUES(?, ?, ?, ?,	?, ?, ?, ?, ?)"""),
                       "new_billing"  : ("""INSERT INTO Billing_Details VALUES(?, 'PLEASE UPDATE', 'PLEASE UPDATE', 'PLEASE UPDATE', 'PLEASE UPDATE')"""),
                       "new_shipping" : ("""INSERT INTO Shipping_Details VALUES(?, 'PLEASE UPDATE', 'PLEASE UPDATE', 'PLEASE UPDATE', 'PLEASE UPDATE')""")
                       }



#%%handles when each page loads for the first time
@app.get("/", response_class=HTMLResponse)
def index(request: Request):
        
    context = {"request" : request}
    
    return templates.TemplateResponse("homepage.html", context)

@app.get("/404.html/", response_class=HTMLResponse)
def index(request: Request):
        
    context = {"request" : request}
    
    return templates.TemplateResponse("404.html", context)

@app.get("/admin_portal.html/", response_class=HTMLResponse)
def index(request: Request):
        
    context = {"request" : request}
    
    #sends you to the login page if it cant load the portal
    try:
        return templates.TemplateResponse("admin_portal.html", context)
    except:
        return templates.TemplateResponse("login.html", context)

@app.get("/customer_portal.html/", response_class=HTMLResponse)
def index(request: Request):
    
    context = {"request" : request}
    
    #sends you to the login page if it cant load the portal
    try:
        return templates.TemplateResponse("customer_portal.html", context)
    except:
        return templates.TemplateResponse("login.html", context)

@app.get("/forgot_password.html/", response_class=HTMLResponse)
def index(request: Request):
        
    context = {"request" : request}
    
    return templates.TemplateResponse("forgot_password.html", context)

@app.get("/homepage.html/", response_class=HTMLResponse)
def index(request: Request):
        
    context = {"request" : request}
    
    return templates.TemplateResponse("homepage.html", context)

@app.get("/index.html/", response_class=HTMLResponse)
def index(request: Request):
        
    context = {"request" : request}
    
    return templates.TemplateResponse("index.html", context)

@app.get("/inventory.html/", response_class=HTMLResponse)
def index(request: Request):
    
    #gets all the data from inside the inventory database
    sql_inventory_data = getDetails(file_names["inventory"], cursor_display_commands["inventory"])
    
    #takes all the relevant data from each row of the database and puts it into an array of dictionaries
    #that the website can then use to display the table
    web_inventory_data = [] 
    for row in sql_inventory_data:
        web_inventory_data.append({
            "id": row[0], 
            "name": row[1], 
            "model_num" : row[2], 
            "colour" : row[3], 
            "supplier" : row[4], 
            "price" : row[5], 
            "q_in_stock" : row[6], 
            "q_on_hold" : row[7]}
            )
    
    context = {"request" : request, "web_inventory_data": web_inventory_data}
    
    return templates.TemplateResponse("inventory.html", context)

@app.get("/login.html/", response_class=HTMLResponse)
def index(request: Request):
    
    #DISPLAYS ACCOUNT DETAILS FOR TESTING PURPOSES ONLY
    cursor_command = cursor_display_commands["accounts"]
    accounts = getDetails(file_names["accounts"], cursor_command)
    
    for account in accounts:
        print (account)
        
    context = {"request" : request}
    
    return templates.TemplateResponse("login.html", context)

@app.get("/Operator_Time_Table.html/", response_class=HTMLResponse)
def index(request: Request):
        
    context = {"request" : request}
    
    return templates.TemplateResponse("Operator_Time_Table.html", context)

@app.get("/privacy_policy.html/", response_class=HTMLResponse)
def index(request: Request):
        
    context = {"request" : request}
    
    return templates.TemplateResponse("privacy_policy.html", context)

@app.get("/register.html/", response_class=HTMLResponse)
def index(request: Request):
        
    context = {"request" : request}
    
    return templates.TemplateResponse("register.html", context)

@app.get("/store.html/", response_class=HTMLResponse)
def index(request: Request):
        
    context = {"request" : request}
    
    return templates.TemplateResponse("store.html", context)

@app.get("/terms_and_conditions.html/", response_class=HTMLResponse)
def index(request: Request):
        
    context = {"request" : request}
    
    return templates.TemplateResponse("terms_and_conditions.html", context)

@app.get("/upload.html/", response_class=HTMLResponse)
def index(request: Request):
        
    context = {"request" : request}
    
    return templates.TemplateResponse("upload.html", context)

#%%handles loading each image
@app.get("/Logo.png/")
def root():
    logo_image = file_dir + "/Logo.png"
    
    return _responses.FileResponse (logo_image)

@app.get("/JawaraLogoWithText.png/")
def root():
    
    logo_image = file_dir + "/JawaraLogoWithText.png"
    
    return _responses.FileResponse (logo_image)

@app.get("/Grey.png/")
def root():
    
    logo_image = file_dir + "/Grey.png"
    
    return _responses.FileResponse (logo_image)


#%%handles log in page
@app.post("/validate_login/", response_class=HTMLResponse)
def index(request: Request, email_address: str = Form(...), password: str = Form(...)):
    
    context = {"request" : request}
    cursor_command = cursor_get_commands["get_all_emails"]
    email_exists = False
    
    #loops through and checks if the inputted email exists in the database
    for temp_email in getDetails(file_names["accounts"], cursor_command):
        if email_address == temp_email[0]:
            email_exists = True
            
            #gets and stores the username to be used throughout the program
            global username
            cursor_command = cursor_get_commands["get_username"] + "'" + email_address + "';"
            username = getDetails(file_names["accounts"], cursor_command)[0][0]
    
    if email_exists:
        #gets the users expected password
        cursor_command = cursor_get_commands["get_password"] + "'" + username + "';"
        actual_password = getDetails(file_names["accounts"], cursor_command)[0][0]
        
        #gathers relevant data in order to send the user to the correct portal if the passwords match
        if password == actual_password:
            #gets account type for the next portal
            cursor_command = cursor_get_commands["get_account_type"] + "'" + username + "';"
            account_type = getDetails(file_names["accounts"], cursor_command)[0][0]
            
            if account_type == "customer":
            
                #gets full name for the next portal
                cursor_command = cursor_get_commands["get_full_name"] + "'" + username + "';"
                full_name = getDetails(file_names["accounts"], cursor_command)[0][0]            

                #gets billing data for the next portal
                billing_details = getDataDict("billing")
                
                #gets shipping data for the next portal
                shipping_details = getDataDict("shipping")
                
                #decides whether to send user to customer or admin portal
                context = {"request" : request, "email": email_address, "name": full_name, "billing_details": billing_details, "shipping_details": shipping_details}
                return templates.TemplateResponse("customer_portal.html", context)
            
            elif account_type == "admin":
                context = {"request" : request}
                return templates.TemplateResponse("admin_portal.html", context)
    
    #if the user is not found then the page resets
    return templates.TemplateResponse("login.html", context)

#creates new account
@app.post("/register_account/", response_class=HTMLResponse)
def index(request: Request, first_name: str = Form(...), second_name: str = Form(...), username: str = Form(...), 
          password: str = Form(...), email: str = Form(...), contact_number: str = Form(...), account_type: str = Form(...)):
    
    #gets all the relevant data from the website and puts it into local variables
    account_id = len(getDetails(file_names["accounts"], cursor_display_commands["accounts"]))
    customer_id = int(str(account_id) + "0" + str(account_id))
    full_name = first_name + " " + second_name
    account_status = "active"
    
    #puts all the relevant data into a list in the correct order
    register_data = [account_id, customer_id, username, password, email, full_name, contact_number, account_type, account_status]
    
    #adds the relevant data to the accounts database using the file directory and the list of relevant data
    AddRow(file_names["accounts"], cursor_add_commands["new_account"], register_data)
    
    #adds rows to the billing and shipping databases aswell with temp values so that the user may update them later
    add_id = [customer_id]
    AddRow(file_names["billing_details"], cursor_add_commands["new_billing"], add_id)
    AddRow(file_names["shipping_details"], cursor_add_commands["new_shipping"], add_id)
    
    context = {"request" : request}
    
    return templates.TemplateResponse("login.html", context)

#%%handles updating the customer portal page

#updates billing information
@app.post("/updated_billing_info", response_class=HTMLResponse)
def updateBillingValues(request: Request, first_name_billing_input: str = Form(...), last_name_billing_input: str = Form(...), 
                    city_billing_input: str = Form(...),county_billing_input: str = Form(...), 
                    country_billing_input: str = Form(...), postcode_billing_input: str = Form(...)):
    
    #gets all the relevant data from the website and puts it into local variables
    first_name = first_name_billing_input
    last_name = last_name_billing_input
    full_name = first_name + " " + last_name
    
    city = city_billing_input
    county = county_billing_input
    address = city + ", " + county
    
    country = country_billing_input
    postcode = postcode_billing_input
    
    #puts all the relevant data into a list in the correct order
    new_details = [full_name, address, postcode, country]
    
    #gets users customer id
    cursor_command = cursor_get_commands["get_customer_id"] + "'" + username + "';"
    customer_id = getDetails(file_names["accounts"], cursor_command)[0][0]
    
    #updates the billing table
    cursor_command = cursor_update_commands["update_billing_data"] + "Billing_Name = '" + new_details[0] + "', Billing_Address = '" +  new_details[1] + "', Billing_Postcode = '" +  new_details[2] + "', Billing_Country = '" +  new_details[3] + "' WHERE Customer_ID = ('" + str(customer_id) + "')";
    updateDetails(file_names["billing_details"], cursor_command)
    
    billing_details = {
        "recipient": new_details[0],
        "address": new_details[1],
        "postcode": new_details[2],
        "country": new_details[3]
    }
    
    #gets users shipping details
    shipping_details = getDataDict("shipping")
    
    #gets users full name
    cursor_command = cursor_get_commands["get_full_name"] + "'" + username + "';"
    full_name = getDetails(file_names["accounts"], cursor_command)[0][0]

    #gets users email
    cursor_command = cursor_get_commands["get_email"] + "'" + username + "';"
    email = getDetails(file_names["accounts"], cursor_command)[0][0]
    
    context = {"request" : request, "email": email, "name": full_name, "billing_details": billing_details, "shipping_details": shipping_details}
 
    return templates.TemplateResponse("customer_portal.html", context)

#updates shipping information
@app.post("/updated_shipping_info", response_class=HTMLResponse)
def updateShippingValues(request: Request, first_name_shipping_input: str = Form(...), last_name_shipping_input: str = Form(...), 
                    city_shipping_input: str = Form(...),county_shipping_input: str = Form(...), 
                    country_shipping_input: str = Form(...), postcode_shipping_input: str = Form(...)):

    #gets all the relevant data from the website and puts it into local variables
    first_name = first_name_shipping_input
    last_name = last_name_shipping_input
    full_name = first_name + " " + last_name
    
    city = city_shipping_input
    county = county_shipping_input
    address = city + ", " + county
    
    country = country_shipping_input
    postcode = postcode_shipping_input
    
    #puts all the relevant data into a list in the correct order
    new_details = [full_name, address, postcode, country]
    
    #gets users customer id
    cursor_command = cursor_get_commands["get_customer_id"] + "'" + username + "';"
    customer_id = getDetails(file_names["accounts"], cursor_command)[0][0]
    
    #updates the shipping table
    cursor_command = cursor_update_commands["update_shipping_data"] + "Shipping_Name = '" + new_details[0] + "', Shipping_Address = '" +  new_details[1] + "', Shipping_Postcode = '" +  new_details[2] + "', Shipping_Country = '" +  new_details[3] + "' WHERE Customer_ID = ('" + str(customer_id) + "')";
    updateDetails(file_names["shipping_details"], cursor_command)
    
    shipping_details = {
        "recipient": new_details[0],
        "address": new_details[1],
        "postcode": new_details[2],
        "country": new_details[3]
    }
    
    #gets users billing details
    billing_details = getDataDict("billing")
    
    #gets users full name
    cursor_command = cursor_get_commands["get_full_name"] + "'" + username + "';"
    full_name = getDetails(file_names["accounts"], cursor_command)[0][0] 
    
    #gets users email
    cursor_command = cursor_get_commands["get_email"] + "'" + username + "';"
    email = getDetails(file_names["accounts"], cursor_command)[0][0]
    
    context = {"request" : request, "email": email, "name": full_name, "billing_details": billing_details, "shipping_details": shipping_details}
    
    return templates.TemplateResponse("customer_portal.html", context)

#updates the users email
@app.post("/updated_email", response_class=HTMLResponse)
def updateEmail(request: Request, email_input: str = Form(...)):
    
    #takes the email input from the website and stores it in a local variable
    email = email_input
    
    #updates the billing table
    cursor_command = cursor_update_commands["update_email"] + '"' + email + '" WHERE Username = ("' + str(username) + '")'
    print ("\n\n\n\n\n\n\n")
    print (cursor_command)
    updateDetails(file_names["accounts"], cursor_command) 
    
    #gets users billing details
    billing_details = getDataDict("billing")
    
    #gets users shipping details
    shipping_details = getDataDict("shipping")
    
    #gets users full name
    cursor_command = cursor_get_commands["get_full_name"] + "'" + username + "';"
    full_name = getDetails(file_names["accounts"], cursor_command)[0][0]
    
    context = {"request" : request, "email": email, "name": full_name,  "billing_details": billing_details, "shipping_details": shipping_details}
    
    return templates.TemplateResponse("customer_portal.html", context)