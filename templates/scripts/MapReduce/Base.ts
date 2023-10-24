export function getInputData(): unknown {
    try {

        // getInputData
        return

    } catch (e) {
        log.error({ title: e.message, details: e })
        throw e
    }
}

export function map(context: EntryPoints.MapReduce.mapContext) : void {
    const inputData = JSON.parse(context.value)
    try {

        // code

        context.write({
            key: 'key',
            value: 'value'
        })

    } catch (e) {
        log.error({ title: e.message, details: e })
        throw e
    }
}

export function reduce(context: EntryPoints.MapReduce.reduceContext) : void {
    try {
        // context.write(context.key, JSON.stringify(context.values))
    } catch (e) {
        log.error({ title: e.message, details: e })
        throw e
    }
}


export function summarize(context: EntryPoints.MapReduce.summarizeContext) : void {
    handleErrorsDuringMap(context)
}


const handleErrorsDuringMap = (context: EntryPoints.MapReduce.summarizeContext) => {
    let errorCount = 0
    context.mapSummary.errors.iterator().each(() => {
        errorCount++
        return true
    })
    if (errorCount) {
        log.error({ title: 'MAP_ERRORS_FOUND_IN_SUMMARY', details: `${errorCount} unhandled error(s) were encountered during map execution. Please check script logs.` })
        // throw error.create({
        //     name: 'MAP_ERRORS_FOUND_IN_SUMMARY',
        //     message: `${errorCount} unhandled error(s) were encountered during map execution. Please check script logs.`
        // })
    } else {
        log.audit({ title: 'NO_ERRORS', details: 'Success.' })
    }
}

