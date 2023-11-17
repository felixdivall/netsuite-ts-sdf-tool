import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

export interface UserConfig {
    filePrefix?: string;
    filenameFormat?: string;
    company?: string;
    username?: string;
    folderStructure?: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const userConfigPath = path.join(__dirname, '../..', 'userConfig.json')

export async function readUserConfig(): Promise<UserConfig> {
    let userConfig: UserConfig = {}

    if (fs.existsSync(userConfigPath)) {
        userConfig = JSON.parse(fs.readFileSync(userConfigPath, 'utf8'))
    }

    return userConfig
}

export async function writeUserConfig(updatedConfig: Partial<UserConfig>) {
    const userConfig = await readUserConfig()

    const newConfig = {
        ...userConfig,
        ...updatedConfig
    }

    fs.writeFileSync(userConfigPath, JSON.stringify(newConfig, null, 4), 'utf8')
}
