# ew-code-bundle-ekv-redirects
Edgeworkers + edgeKV JavaScripts used to an edgeworkers redirect rule. 
When a request is coming, edgeworkers will hash the path in the request and search corresponding edgekv database using the hashed path as key to get destination url and redirect to there.

## Set ew-code-bundle-ekv-redirects
site: e.g. uat13.canadiantire.ca

Pre-requisite: 
* need Akamai CLI package, edgekv and edgeworkers api packages intalled to get edgeworkers authentication token to the site for akamai advanced header `Akamai-EW-Trace`, and edgekv token for edgeworkers to access edgekv database.
* Get familiar with the EdgeKV data model (namespace, group, item). [link](https://learn.akamai.com/en-us/webhelp/edgeworkers/edgekv-getting-started-guide/index.html)
* Create an EdgeWorker ID (EWID) and add it to your site's config in property manager. [link](https://learn.akamai.com/en-us/webhelp/edgeworkers/edgeworkers-user-guide/GUID-F11192E1-0BFB-415F-88FA-5878C30B7D2A.html)
* Initialize your EdgeKV store [link to instructions](https://learn.akamai.com/en-us/webhelp/edgeworkers/edgekv-getting-started-guide/index.html). This step also creates the default namespace used in this example.
* Generate your management API/CLI client credentials. [link](https://developer.akamai.com/api/getting-started)
* If you intend to use the EdgeKV management API, refer to the latest instructions [here](https://github.com/akamai/edgeworkers-examples/tree/master/edgekv/apis)
* If you intend to use the EdgeKV Command Line Interface (CLI), make sure you have the latest version installed. [link to instructions](https://github.com/akamai/cli-edgeworkers/blob/master/docs/edgekv_cli.md)
* Generate EdgeKV Access Token for the default namespace. [link](https://learn.akamai.com/en-us/webhelp/edgeworkers/edgekv-getting-started-guide/index.html)

### Steps
1. Use the [EdgeWorkers CLI](https://developer.akamai.com/cli/packages/edgeworkers.html) command to generate a secret key

   `akamai edgeworkers secret`

   Here’s an example of a secret key (this token is an example and should not be used in your user-defined variable or to generate an authentication token):

   `da47a7f878472842ef0eaaa9de0f752aace84d337c7a119768c9a04e3640e271`

2. Add a user-defined variable named, **EW_DEBUG_KEY** to your property like uat13.canadiantire.ca.
3. Enter the secret key you created in Step 1 into the Initial Value column of the user-defined variable.

    ![alt text](https://learn.akamai.com/en-us/webhelp/edgeworkers/edgeworkers-user-guide/GUID-ABA87948-098E-4571-A001-7BC6F3E20381-low.png "Setting Property Variables")
   * You'll also re-use this secret key, when using the [EdgeWorkers CLI](https://developer.akamai.com/cli/packages/edgeworkers.html) to generate the authentication token for debugging.
4. Add a user-defined variable named, **PATH_HASH** which will be used in code.
5. generate edgekv_tokens.js and copy the file in this directory. command is:
```sheel
akamai edgekv create token redirects_token --save_path=. --overwrite --staging=allow --production=allow --ewids=all --namespace=default+rwd,redirects+rwd --expiry=2022-09-30
```
**redirects** is namespace used in the code, created in Staging group (groupId 175502) in akamai staging and production network
```sheel
akamai edgekv create ns staging redirects --groupId 175502 --retention 90
```
and 

```shell
akamai edgekv create ns production redirects --groupId 175502 --retention 90
```
6. import data into edgekv database in Staging group and redirects namespace. You can use akamai command line.

example for text item:
```shell
akamai edgekv write text staging redirects Staging en "Hello World" 
```

example for json record, deals.json has one json record with key 88f404e435e4d324c73eb6b91d01e28c ( "/deal" md5 hased) :
```shell
akamai edgekv write jsonfile staging redirects Staging 88f404e435e4d324c73eb6b91d01e28c ./deals.json
```
Or use edgekv-importer util to load multiple records from a csv file. Please refer to edgekv-importer README
```shell
edgekv-importer --csv promo-codes.csv --key source  --namespace redirects --group Staging
```

7. Add blank Rule to delivery property called **edgeWorker-redirect**
8. Add condition for path does not match /odp/poc* (this path has been used by ew-checkPermission-redirect rule)
9. Add EdgeWorkers behaviour
10. Save the property
11. Create new EdgeWorker Identifier by clicking **EdgeWorkers Management application** in the behaviour note
12. Click the **Create Worker ID** button
13. Enter **uat13.canadiantire.ca-edgeKV-redirects** in the Name field 
14. Select the group you want the EdgeWorker to be available in
15. Click the **Create Worker ID** button
16. Click the newly created **ID** or **Name**
17. Click **Create Version** button
18. Drag and Drop or Select the ew-code-bundle-ekv-redirects.tgz file which contains main.js, bundle.js and edgekv_tokens.js here
19. Select the **Create Version** button.
20. Active the newly added version to staging/production from the action menu
21. Reload the property, select the newly created EdgeWorker
22. Save the property
23. Active the property to staging/production 
24. Use the secret key you created in Step 1 to generate an authentication token using this [EdgeWorkers CLI](https://developer.akamai.com/cli/packages/edgeworkers.html) command.   
	```
	$ akamai edgeworkers auth --expiry 720 uat13.canadiantire.ca 
    ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	Add the following request header to your requests to get additional trace information.
	Akamai-EW-Trace: st=1652970913~exp=1653014113~acl=/*~hmac=63afa30fe96931a90020a8bce22f8a0e7be22a681071a7ece47a953e055992d1
	----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------```
25. To have debug and logging response headers returned add two Akamai headers to the request on browser. See [Enhanced debug headers](https://learn.akamai.com/en-us/webhelp/edgeworkers/edgeworkers-user-guide/GUID-F888493F-6186-4400-89B4-0AEDF872DFC9.html) for more information.
    * a Pragma header with a value of "akamai-x-ew-debug,akamai-x-ew-debug-subs"  `Pragma: akamai-x-ew-debug, akamai-x-ew-debug-subs`
    * The Akamai-EW-Trace header created in Step 24 `Akamai-EW-Trace: st=1652970913~exp=1653014113~acl=/*~hmac=63afa30fe96931a90020a8bce22f8a0e7be22a681071a7ece47a953e055992d1`

## test cases on browser 
1. check data in edgekv database
* for path /home 
```shell
akamai edgekv read item production redirects Staging `echo -n /home | md5sum | awk '{print $1}'`
```
record is:
```
----------------------------------------------------------------------------------------------------------------------------------------
--- Item 4858dab5b4ac16ad2b7d274698c2532a from group Staging, namespace redirects and environment production retrieved successfully. ---
----------------------------------------------------------------------------------------------------------------------------------------
{"source":"/home","location":"https://uat13.canadiantire.ca/en.html"}
```
* for path /google
```shell
akamai edgekv read item production redirects Staging `echo -n /google | md5sum | awk '{print $1}'`
```
record is:
```
----------------------------------------------------------------------------------------------------------------------------------------
--- Item 8ad3abd0cb87be23b3e4564c9ac88a43 from group Staging, namespace redirects and environment production retrieved successfully. ---
----------------------------------------------------------------------------------------------------------------------------------------
{"source":"/google","location":"https://www.google.ca"}
```

2. verify redirection on browser
* https://uat13.canadiantire.ca/home
You will get https://uat13.canadiantire.ca/en.html page. 

* https://uat13.canadiantire.ca/odp/google
You will get https://www.google.ca home page.
