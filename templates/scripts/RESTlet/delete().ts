function _delete(requestParams: Request): Response {
    const recordType = requestParams.recordType
    const recordId = requestParams.recordId

    // ... delete record logic ...

    return {
        success: true,
        message: 'Record deleted successfully'
    }
}
export { _delete as delete }
