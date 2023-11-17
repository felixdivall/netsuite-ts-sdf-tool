export function isValidFileName(fileName: string) {
    const regex = /^[a-z_]+(?:\.ts)?$/ // regular expression: allows only lowercase a-z, _, and ., and must end with .ts
    return regex.test(fileName)
}

export function extractScriptType(fileName: string): string | null {
    // supports the following naming conventions: prefix_scriptType_projectName and prefix_projectName_scriptType
    const regex1 = /_(ue|mr|cs|sl|ss|rl|po|mu|wa)$/
    const regex2 = /_(ue|mr|cs|sl|ss|rl|po|mu|wa)_/

    const match1 = fileName.match(regex1)
    const match2 = fileName.match(regex2)

    if (match1 && match1[1]) {
        return match1[1]
    } else if (match2 && match2[1]) {
        return match2[1]
    }
    return null
}
