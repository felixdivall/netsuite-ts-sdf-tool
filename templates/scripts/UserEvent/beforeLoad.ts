export function beforeLoad(context: EntryPoints.UserEvent.beforeLoadContext) : void {
    if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT && context.type !== context.UserEventType.XEDIT) {
        return
    }
    try {

        const rec = context.newRecord
        // code

    } catch (e) {
        log.error({ title: 'Error Details', details: e })
    }
}

