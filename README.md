Rent-manager
============
Client side tool to match CSV files from ING, SNS and ABN banks to your tenants.  

**How it works:**  
Searches the accountnumber in your tenant data and checks each payment with the rent.

###Tenant.csv:
 Place  |       Name       |     Phone      |  Account   |   Rent   |      Email       |     Street     |  Start |  Stop  | Deposit  |
--------|------------------|----------------|------------|----------|------------------|----------------|--------|--------|----------|
 vBUSG  | Miranda Payne    | (229) 605-6600 | 5825708385 | $4125.90 | noce@ve.net      | Nobwow Square  |        |        | $9452.21 |
 3Oy#C  | Reagan Davidson  | (762) 323-6682 | 9456154649 | $6657.03 | ob@kosifo.co.uk  | Vacrem Highway |        |        | $9225.65 |
 DpciT  | Alexandra Hunt   | (889) 487-1575 | 7270373313 | $3482.51 | dugevawe@moj.org | Tewi Plaza     |        |        | $5571.30 |
 
###Supports:
* Girotel CSV
* SNS CSV
* ABN CSV

###Features:
* Search by any field
* Sort by any (meaningful) field
* Filter by: tenants only, positive payments, more to come
* Highlight payments that don't match rent (on/off)
* Stores all data in localStorage

###TODO:
* Group payments (by month)
* Fix some CSS issues
* Intelligently keep old data when a new bank file is loaded
* Store filter settings