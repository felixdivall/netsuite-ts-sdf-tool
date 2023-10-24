export function onAction(context: EntryPoints.WorkflowAction.onActionContext): void {
    const newRec = context.newRecord
    const oldRec = context.oldRecord

    const newFieldValue = newRec.getValue({ fieldId: 'custfield_sample' })
    const oldFieldValue = oldRec.getValue({ fieldId: 'custfield_sample' })

    if (newFieldValue !== oldFieldValue) {
        // Implement logic if the field value has changed
        // Example: Update another field based on the change
        newRec.setValue({ fieldId: 'custfield_another_sample', value: 'Updated Value' })
    }
}
