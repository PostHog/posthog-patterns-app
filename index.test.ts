import { Meta, PostHogEvent } from '@posthog/plugin-scaffold'

import plugin, { PatternsMetaInput } from './index'

const { composeWebhook } = plugin

const testWebhookUrl = 'https://api-staging.patterns.app/api/app/webhooks/wh1234'

const meta: Meta<PatternsMetaInput> = {
    attachments: {},
    cache: {
        set: async () => {
            //
        },
        get: async () => {
            //
        },
        incr: async () => 1,
        expire: async () => true,
        lpush: async () => 1,
        lrange: async () => [],
        llen: async () => 1,
        lpop: async () => [],
        lrem: async () => 1,
    },
    config: {
        webhookUrl: testWebhookUrl,
    },
    geoip: {
        locate: async () => null,
    },
    global: {},
    jobs: {},
    metrics: {},
    storage: {
        set: async () => {
            //
        },
        get: async () => {
            //
        },
        del: async () => {
            //
        },
    },
    utils: {
        cursor: {
            init: async () => {
                //
            },
            increment: async () => 1,
        },
    },
}

const mockEvent: PostHogEvent = {
    uuid: '10000000-0000-4000-0000-000000000000',
    team_id: 1,
    distinct_id: '1234',
    event: 'my-event',
    timestamp: new Date(),
    properties: {
        $ip: '127.0.0.1',
        $elements_chain: 'div:nth-child="1"nth-of-type="2"text="text"',
        foo: 'bar',
    },
}

test('composeWebhook called for event', async () => {
    if (!composeWebhook) {
        throw new Error('Not implemented')
    }

    const webhook = composeWebhook(mockEvent, meta)

    expect(webhook).toHaveProperty('url', testWebhookUrl)
    expect(webhook?.headers).toMatchObject({
        'Content-Type': 'application/json',
    })
    expect(webhook).toHaveProperty('method', 'POST')
    expect(webhook).toHaveProperty('body')

    const webhookBody = JSON.parse(webhook?.body || '')
    expect(webhookBody).toMatchObject(JSON.parse(JSON.stringify([mockEvent]))) // Need to do parse/stringify dance for date string
})

test('composeWebhook returns webhook for allowed event', async () => {
    if (!composeWebhook) {
        throw new Error('Not implemented')
    }

    const metaWithAllowEventTypes: Meta<PatternsMetaInput> = {
        ...meta,
        config: { ...meta.config, allowedEventTypes: '$pageView, $autoCapture, $customEvent1' },
    }

    const allowedEvent = { ...mockEvent, event: '$pageView' }

    const webhook1 = composeWebhook(allowedEvent, metaWithAllowEventTypes)
    expect(webhook1).toHaveProperty('url', testWebhookUrl)
    expect(webhook1?.headers).toMatchObject({
        'Content-Type': 'application/json',
    })
    expect(webhook1).toHaveProperty('method', 'POST')
    expect(webhook1).toHaveProperty('body')

    const webhook1Body = JSON.parse(webhook1?.body || '')
    expect(webhook1Body).toMatchObject(JSON.parse(JSON.stringify([allowedEvent]))) // Need to do parse/stringify dance for date string

    const unallowedEvent = { ...mockEvent, event: '$pageLeave' }
    expect(composeWebhook(unallowedEvent, metaWithAllowEventTypes)).toBeNull()
})

test('composeWebhook null for unallowed event', async () => {
    if (!composeWebhook) {
        throw new Error('Not implemented')
    }

    const metaWithAllowEventTypes: Meta<PatternsMetaInput> = {
        ...meta,
        config: { ...meta.config, allowedEventTypes: '$pageView, $autoCapture, $customEvent1' },
    }

    const unallowedEvent = { ...mockEvent, event: '$pageLeave' }
    expect(composeWebhook(unallowedEvent, metaWithAllowEventTypes)).toBeNull()
})
