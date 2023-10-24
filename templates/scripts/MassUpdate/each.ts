export function each(context: EntryPoints.MassUpdateContext.each): void {
    const recordType = context.type
    const recordId = context.id

    try {
        // Load the record that's currently being processed
        const currentRecord = record.load({
            type: recordType,
            id: recordId
        })
        currentRecord.setValue({ fieldId: 'custentity_some_custom_field', value: 'Updated Value' })
        currentRecord.save()

    } catch (error) {
        log.error({ title: 'Error processing record ' + recordId, details: error })
    }
}
