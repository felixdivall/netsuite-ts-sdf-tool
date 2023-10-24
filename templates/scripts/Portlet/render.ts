export function render(context: EntryPoints.Portlet.renderContext): void {
    const portlet = context.portlet
    portlet.title = 'Sample Portlet Title'

    // Add content to the portlet

    portlet.html = `
        <div>
            <p>This is a sample portlet created using TypeScript.</p>
            <a href="https://www.netsuite.com">Visit NetSuite</a>
        </div>
    `
}
