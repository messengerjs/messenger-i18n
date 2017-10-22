/**
 * i18n support. Adds `function t(key, ...args)` to `envelope`
 */
const _ = {
  get: require('lodash.get'),
  memoize: require('lodash.memoize')
}

const IntlMessageFormat = require('intl-messageformat')

module.exports = intlInitialize

function intlInitialize(messages) {
  if (!messages) messages = './i18n'

  if (typeof messages === 'string') {
    messages = require('app-root-path').require(messages)
  }

  const languages = Object.keys(messages).map(locale =>
    locale.replace('_', '-').toLowerCase()
  )

  ensureIntlIsAvailable(languages)

  function messageForLocale(key, locale) {
    const allLocales = [locale, locale.split('-').slice(0, 1), 'en']
    let foundMessage
    for (let i = 0; !foundMessage && i < allLocales.length; ++i) {
      foundMessage = _.get(messages[allLocales[i]], key)
    }
    return foundMessage || `${key}(${locale})`
  }

  const formatterForLocale = _.memoize(
    (key, locale) => {
      const message = messageForLocale(key, locale)
      const formatter = new IntlMessageFormat(message, locale)
      return formatter
    },
    (key, locale) => {
      return `${locale}.${key}`
    }
  )
  return i18n

  function i18n(message, context) {
    const locale = _.get(context, 'messenger.sender.profile.locale', 'en_us')
      .replace('_', '-')
      .toLowerCase()

    context.t = t

    function t(key, ...args) {
      const formatter = formatterForLocale(key, locale)
      return formatter.format.apply(formatter, args)
    }
  }
}

function ensureIntlIsAvailable(localesMyAppSupports) {
  if (global.Intl) {
    // Determine if the built-in `Intl` has the locale data we need.
    const areIntlLocalesSupported = require('intl-locales-supported')
    if (!areIntlLocalesSupported(localesMyAppSupports)) {
      // `Intl` exists, but it doesn't have the data we need, so load the
      // polyfill and replace the constructors with need with the polyfill's.
      const IntlPolyfill = require('intl')
      Intl.NumberFormat = IntlPolyfill.NumberFormat
      Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat
    }
  } else {
    // No `Intl`, so use and load the polyfill.
    global.Intl = require('intl')
  }
}
