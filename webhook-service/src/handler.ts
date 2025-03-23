import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import crypto from "crypto";

export const webhook = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    try {
        // Log incoming event
        console.log("Received event:", JSON.stringify(event, null, 2));

        // Force failuer - To test dead-letter-queue implementation
        // throw new Error("Forced error to test DLQ");


        // Extract verification signature header
        const signature = event.headers["verification-signature"];
        if (!signature) return badRequest("Missing verification-signature");

        // Ensure request body is present
        if (!event.body) return badRequest("Missing request body");

        // Verify signature
        if (!verifySignature(event.body, signature)) return unauthorized("Invalid signature");
        console.log("Signature verified successfully");

        // Transform payload into Transaction objects before processing
        const transformedData = transformPayload(JSON.parse(event.body));
        console.log(transformedData)


        // Return success response
        return successResponse("Webhook received & processed successfully!", transformedData);
    } catch (error) {
        console.error("Error processing webhook:", error);
        return serverError("Internal Server Error");
    }
};

// Returns a 400 Bad Request response
const badRequest = (message: string) => response(400, { code: 400, message });

// Returns a 401 Unauthorized response
const unauthorized = (message: string) => response(401, { code: 401, message });

// Returns a 500 Internal Server Error response
const serverError = (message: string) => response(500, { code: 500, message });

// Returns a 200 Success response
const successResponse = (message: string, data: any) => response(200, { code: 200, message, data });

// Generic response builder
const response = (statusCode: number, body: object): APIGatewayProxyResult => ({
    statusCode,
    body: JSON.stringify(body),
});


// Function to verify signature (currently bypassed, always returns true)
function verifySignature(payload: string, signature: string): boolean {
    try {
        // Bypassing actual verification for now
        return true;

        // Create a verifier using SHA256
        const verifier = crypto.createVerify("SHA256");
        verifier.update(payload);
        verifier.end();

        // Format the public key in PEM format
        const publicKey = `-----BEGIN PUBLIC KEY-----\n${process.env.MONOOVA_PUBLIC_KEY}\n-----END PUBLIC KEY-----`;
        return verifier.verify(publicKey, signature, "base64");
    } catch (error) {
        console.error("Signature verification failed:", error);
        return false;
    }
}

interface Transaction {
    id: string;
    amount: number;
    createdAt: Date;
    externalId?: string;
    from?: string;
    reference: string;
    status: string;
    to?: string;
    type: string;
    updatedAt: Date;
    metadata: Record<string, unknown>;
    info?: Record<string, unknown>;
}


// Transform the raw webhook payload into an array of Transaction objects.
function transformPayload(payload: string): Transaction[] {
    try {
        const parsed = JSON.parse(payload);

        if (!parsed.DirectCreditDetails || !Array.isArray(parsed.DirectCreditDetails)) {
            console.warn("DirectCreditDetails is missing or not an array.");
            return [];
        }

        const transactions: Transaction[] = parsed.DirectCreditDetails.map((detail: any) => ({
            id: detail.TransactionId,
            amount: detail.Amount,
            createdAt: new Date(detail.DateTime),
            externalId: String(detail.BatchId),
            from: detail.SourceAccountNumber,
            reference: detail.LodgementRef,
            status: "Completed",
            to: String(detail.AccountNumber),
            type: "InboundDirectCredit",
            updatedAt: new Date(),
            metadata: {
                Bsb: detail.Bsb,
                AccountName: detail.AccountName,
                TransactionCode: detail.TransactionCode,
                RemitterName: detail.RemitterName,
                NameOfUserSupplyingFile: detail.NameOfUserSupplyingFile,
                NumberOfUserSupplyingFile: detail.NumberOfUserSupplyingFile,
                DescriptionOfEntriesOnFile: detail.DescriptionOfEntriesOnFile,
                Indicator: detail.Indicator,
                WithholdingTaxAmount: detail.WithholdingTaxAmount,
                SourceBsb: detail.SourceBsb,
            },
            info: {
                rawDetail: detail,
            },
        }));

        console.log("Transformed transactions:", transactions);
        return transactions;
    } catch (error) {
        console.error("Error transforming payload:", error);
        return [];
    }
}

