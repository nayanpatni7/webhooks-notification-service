# webhooks-notification-service


## **Overview**
This repository contains a serverless webhook processing service built using AWS EventBridge, Lambda, API Gateway, and other AWS services. It is designed to handle inbound webhook events efficiently while ensuring security, reliability, and observability.


## **Design Decisions**

1. **Serverless Approach**: Using AWS Lambda, API Gateway, and EventBridge to reduce infrastructure management overhead and ensure scalability.
2. **Signature Verification**: Implements signature validation based on Monoova’s webhook specifications to verify incoming payload authenticity.
3. **Retries & Error Handling**:
   - Uses AWS EventBridge’s retry policy (max 3 attempts, 900s event age limit).
   - Messages failing after retries are sent to a Dead Letter Queue (DLQ) for manual review.
4. **Logging & Monitoring**: Logs all API interactions and errors using AWS CloudWatch for observability.
5. **Asynchronous Processing**: Uses EventBridge for event-driven architecture, ensuring minimal latency and better reliability.


---------------------------------------------------------------------------------------------------

## Setup steps - 

### **Prerequisites**
- AWS CLI configured with necessary IAM permissions.
- Serverless Framework (if applicable) installed.

### **Installation**
```sh
# Clone the repository
git clone https://github.com/nayanpatni7/webhooks-notification-service
cd webhook-service

# Install dependencies
npm install
```


### **Deployment**
To deploy the service on AWS:


1. **Install & configure aws-cli (if not already installed)**  
```sh
   npm install -g serverless
```

2. **Install & configure Serverless Framework (if not already installed)**  
```sh
   npm install -g serverless
   serverless config credentials --provider aws --key <AWS_ACCESS_KEY> --secret <AWS_SECRET_KEY>
```

3. **Deploy API Gateway + Lambda for Webhook Handling(ONLY REQUIRED FIRST TIME FOR SERVICE INSTANTIATION)**
```sh
serverless create --template aws-nodejs-typescript --path webhook-service
cd webhook-service
npm install
```

4. **Deploy/Stop the service**
```sh
# Deploy using
serverless deploy

# Stop using
serverless remove
```


---------------------------------------------------------------------------------------------------


## **API Usage**

### **Webhook Endpoint**
- **Method:** `POST`
- **URL:** `https://upq8292gm1.execute-api.us-east-1.amazonaws.com/dev/webhook`
- **Headers:**
  - `Content-Type: application/json`
  - `verification-signature: <signature>`
- **Body:** (Example Payload)
```json
{
  "TotalCount": 2,
  "TotalAmount": 2,
  "DirectCreditDetails": [
    {
      "TransactionId": "D00100537784",
      "BatchId": 212749,
      "DateTime": "2020-01-13T14:21:50.553",
      "Bsb": "802-985",
      "AccountNumber": 419001918,
      "AccountName": "Monoova AccountName",
      "TransactionCode": "50",
      "Amount": 1,
      "LodgementRef": "Ref1",
      "RemitterName": "ABC XYZ",
      "NameOfUserSupplyingFile": "M PAYMENTS",
      "NumberOfUserSupplyingFile": "483449",
      "DescriptionOfEntriesOnFile": "PAYMENT TRNSFR",
      "Indicator": "",
      "WithholdingTaxAmount": 0,
      "SourceBsb": "123-123",
      "SourceAccountNumber": "123456789"
    },
    {
      "TransactionId": "D00100537785",
      "BatchId": 212749,
      "DateTime": "2020-01-13T14:30:50.002",
      "Bsb": "802-985",
      "AccountNumber": 419001923,
      "AccountName": "Monoova AccountName2",
      "TransactionCode": "50",
      "Amount": 1,
      "LodgementRef": "Ref2",
      "RemitterName": "STU XYZ",
      "NameOfUserSupplyingFile": "M PAYMENTS",
      "NumberOfUserSupplyingFile": "483449",
      "DescriptionOfEntriesOnFile": "PAYMENT TRNSFR",
      "Indicator": "",
      "WithholdingTaxAmount": 0,
      "SourceBsb": "123-123",
      "SourceAccountNumber": "234123896"
    }
  ]
}
```

### **Response**
#### **Success Response**
```json
{   "code": 200,
    "message": "Webhook received & processed successfully!",
    "data": []
}
```

#### **Error Response (Missing verification-signature)**
```json
{
    "code": 400,
    "message": "Missing verification-signature"
}
```

#### **Error Response (invalid verification-signature)**
```json
{
    "code": 401,
    "message": "Invalid signature"
}
```