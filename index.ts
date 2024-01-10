import { Plugin, PluginInput, Webhook } from '@posthog/plugin-scaffold'

type PatternsInputs = {
    webhookUrl: string
    allowedEventTypes?: string
}

export interface PatternsMetaInput extends PluginInput {
    config: PatternsInputs
}

const plugin: Plugin<PatternsMetaInput> = {
    composeWebhook: (event, { config }) => {
        const allowedEventTypesSet = new Set<string>()

        if (config.allowedEventTypes) {
            config.allowedEventTypes
                .split(',')
                .map((eventType: string) => eventType.trim())
                .forEach((e) => allowedEventTypesSet.add(e))
        }

        // allowedEventTypes is optional, so we only filter if it has a value, otherwise every event gets processed
        if (allowedEventTypesSet.size !== 0 && !allowedEventTypesSet.has(event.event)) {
            return null
        }

        return {
            url: config.webhookUrl,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([event]),
        } as Webhook
    },
}

export default plugin
