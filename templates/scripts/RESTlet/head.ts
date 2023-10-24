export function head(requestParams: Request): Response {
    const recordType = requestParams.recordType
    const recordId = requestParams.recordId

    // ... retrieve metadata logic ...

    return {
        success: true,
        data: {} // Metadata info
    }
}
