import isInteger from 'is-integer'

const levels = [
    'error',
    'warn',
    'info',
    'verbose',
    'debug',
    'silly'
]

function Logger(category, level, transport) {
    if (!isInteger(level)) {
        if (levels.indexOf(level) >= 0) {
            level = levels.indexOf(level)
        } else {
            throw new Error(`${level} is not a valid logging level`)
        }
    }

    levels.forEach((name, index) => {
        this[name] = (...args) => {
            if (index <= level) {
                if(transport instanceof Array) {
                    transport.forEach(t => t(category, level, ...args))
                } else {
                    transport(category, level, ...args)
                }
            }
        }
    })
}

const pueblo = {
    categories: {},
    transports: {
        console: (options) => (category, level, ...args) => {
            let msg = null

            if (args[0] instanceof String) {
                msg = `[${category}] ${args.shift()}`
            } else {
                msg = `[${category}]`
            }

            if (level <= 0) {
                console.error(msg, ...args)
            } else
            if (level <= 1) {
                console.warn(msg, ...args)
            } else {
                console.log(msg, ...args)
            }
        },
        bufferedQueue: ({
            name = 'bufferedQueue',
            size = 3,
            flushTimeout = 5000,
            onData,
        }) => {
            let queue = []
            let intervalId = null

            const flushData = () => {
                const content = queue
                content.forEach(chunk => onData(chunk))
                queue = []
            }

            return (category, level, ...args) => {
                queue.push({category, level, args})
                if (queue.length >= size) {
                    clearTimeout(intervalId)
                    intervalId = null
                    flushData()
                } else
                if (!intervalId) {
                    intervalId = setTimeout(flushData, flushTimeout)
                }
            }
        }
    },
    createCategory: function(name, level = 'silly', transport = null) {
        if(this.categories[name]) {
            throw new Error(`"${name}" category already exists`)
        } else {
            this.categories[name] = new Logger(
                name, level,
                transport || this.transports.console()
            )
        }
    },
    get: function get(category) {
        if (!this.categories[category]) {
            throw new Error(`"${category}" category does not exist`)
        }
        return this.categories[category]
    }

}

export default pueblo
