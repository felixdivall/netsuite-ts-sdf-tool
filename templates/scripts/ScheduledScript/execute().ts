export function execute(): void {
    try {
        log.audit('Scheduled Script Started', '---')

        // code

        log.audit('Scheduled Script Completed', '+++')
    } catch (e) {
        log.error({ title: e.message, details: e })
    }
}
