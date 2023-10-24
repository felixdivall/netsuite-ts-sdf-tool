export function onRequest(context: EntryPoints.Suitelet.onRequestContext): void {
    if (context.request.method === 'GET') {
        const entity = context.request.parameters.entity
        const form = createSublist(entity)
        context.response.writePage({ pageObject: form })
    }
}

function createSublist(entity) {
    const form = ui.createForm({
        title: ' ',
        hideNavBar: false
    })
    const sublist = form.addSublist({
        id : 'custpage_sublist',
        type : ui.SublistType.LIST,
        label : 'label'
    })

    /* addFields */

    fetchData(
        sublist,
        entity,
    )
    return form
}


function fetchData(sublist, entity: number): void {
    const filters = [
        /* ADD FILTERS TO YOUR SEARCH */
    ]
    const searchObj = search.create({
        type: 'search type',
        filters: filters,
        columns:[
            search.createColumn({
                name: 'entity',
                summary: search.Summary.GROUP,
                label: 'Name'
            }),
        ]
    })
    let i = 0
    searchObj.run().each(function(result){

        /* example =================================================================
        const customer = result.getText({ name: 'entity', summary: search.Summary.GROUP }) as string
        sublist.setSublistValue({
            id: columnOne,
            line: i,
            value: customer
        })
        ======================================================================== */

        i++
        return true
    })
}
