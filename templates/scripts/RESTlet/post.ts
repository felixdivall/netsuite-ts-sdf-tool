export function post(requestBody: Request): Response {
    const recordType = requestBody.recordType
    const recordData = requestBody.data

    // ... create record logic ...

    return {
        success: true,
        message: 'Record created successfully'
    }
}
