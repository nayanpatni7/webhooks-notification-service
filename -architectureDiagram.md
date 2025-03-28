
# Architecture-diagram

# Architecture Diagram link [Revised_architecture]
https://drive.google.com/file/d/1mezdJDIqNWqGmlPElZxWObJAv0nC7tzf/view?usp=sharing










<!-- ----------------------------------------------------------------------- -->


# Architecture Diagram with Webhook Processing Flow (Old flow)

+------------------------------------------------------------------+
|                    Serverless Architecture                       |
|                                                                  |
|   +--------+                                                     |
|   |  User  |                                                     |
|   +--------+                                                     |
|        |                                                         |
|        |  ① Hits the webhook URL (API Gateway Endpoint)         |
|        v                                                         |
|   +------------------+                                           |
|   |  API Gateway    |                                            |
|   +------------------+                                           |
|        |                                                         |
|        |  ② Routes request to AWS Lambda                        | 
|        v                                                         |
|   +------------------+                                           |
|   |   AWS Lambda    |                                            |
|   +------------------+                                           |
|        |                                                         |
|        |  ③ Processes Webhook Request:                          |
|        |     - ✅ Signature verification of incoming event       |
|        |     - ✅ Request-body presence check                    |
|        |     - ✅ Incoming-data validation & error handling      |
|        |     - ✅ Data transformation to Transaction interface   |
|        |          for further processing                         |
|        |     - ✅ Actual processing & execution                  |
|        v                                                         |
|   +------------------+                                           |
|   | EventBridge Bus |                                            |
|   +------------------+                                           |
|        |                                                         |
|        |  ④ Routes event with retry policy                      |
|        |  (Max Retries: 3, EventAge: 900s)                       |
|        v                                                         |
|   +------------------+                                           |
|   |   CloudWatch    |                                            |
|   +------------------+                                           |
|        |                                                         |
|        |  ⑤ Logs API Calls & Errors                             |
|        v                                                         |
|   +--------------------------------+                             |
|   |     (Conditional Failure Step) |                             |
|   +--------------------------------+                             |
|        |                                                         |
|        |  If the event fails after retries:                      |
|        |     - SNS publishes failure notification                |
|        |     - SQS DLQ stores failed event                       |
|        v                                                         |
|   +------------------+                                           |
|   |  SNS & SQS DLQ   |                                           |
|   +------------------+                                           |
|        |                                                         |
|        |  ⑥ Failed event is stored for debugging                |
|        v                                                         |
|   +------------------+                                           |
|   |   Manual Review  |                                           |
|   +------------------+                                           |
+------------------------------------------------------------------+


This architecture handles incoming webhook requests in a serverless environment using AWS services. The request flows through API Gateway, is processed by Lambda, logged in CloudWatch, and failed requests are sent to an SQS Dead Letter Queue (DLQ) for manual review.


### **Flow Steps**  

1️⃣ **User hits the webhook URL** – API Gateway receives the request.  

2️⃣ **API Gateway forwards the request** – Routes it to the AWS Lambda function.  

3️⃣ **Lambda processes the request**:  
   - ✅ Verifies request signature for security.  
   - ✅ Ensures request body is present.  
   - ✅ Validates request data and handles errors.  
   - ✅ Transforms request data into a structured format.  
   - ✅ Processes the transformed data.  

4️⃣ **EventBridge applies retry policy** – If Lambda execution fails, it retries up to 3 times within 900s.  

5️⃣ **CloudWatch logs API calls & errors** – Helps monitor execution and failures.  

6️⃣ **Failed events go to SQS DLQ** – If retries fail, the request is stored for manual review.  

7️⃣ **Manual review of failed requests** – Ensures no lost events in case of persistent failures.  



-------------------------------------------------------------------------------------------------------------


### **Note**  

- The signature verification logic has been implemented based on Monoova’s **Receive Inbound Direct Credits Webhook** specifications.  
- However, due to the absence of an API key from Monoova, strict verification is currently bypassed, and the function always returns `true`.  
- The API key has been requested, and once received, the verification mechanism will be updated to enforce proper security checks.