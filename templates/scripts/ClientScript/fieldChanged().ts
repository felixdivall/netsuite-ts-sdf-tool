export function fieldChanged(context: EntryPoints.Client.fieldChangedContext): void {
    const rec = context.currentRecord
    const sublist = context.sublistId
    const field = context.fieldId
    const line = context.line

    if (sublist === '' && [''].includes(field)) {
        // code
    }
}
