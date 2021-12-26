const { TextChannel, MessageActionRow, MessageSelectMenu, MessageEmbed, BaseCommandInteraction } = require("discord.js"),
chalk = require('chalk'),
{ MongoClient } = require('mongodb'),
uri = process.env["mongoToken"],
mongoClient = new MongoClient(uri),
Unicodes = require('discord-unicodes');

module.exports = class Util {
    /**
     * @property { Number|} `toDate`
     * @property { Function `callback`
     * @author [`Harijs Krūtainis`](https://stackoverflow.com/users/2944129/harijs-kr%c5%abtainis)
     * @returns `setTimeout(callback, toDate)`
     * @example dateFrom(new Date(2021, 5, 5, 13, 0), function() { console.log('Meu aniversário!!') })
     * @description year, month 0-11, date, hour, min (can add, sec, msec) 
     */
    static dateFrom(toDate, callback) {
      try {
        if (!(toDate instanceof Date) && typeof toDate !== 'number') throw new TypeError("Informe uma data válida 'toDate'")
        if (!callback || typeof callback !== 'function') throw new TypeError("A callback não é do tipo 'Function'")

        if (typeof toDate !== 'number') toDate = toDatoDate.getTime() - Date.now()
        
        return setTimeout(callback(), toDate)
      } catch(e) {
        console.error(e)
      }
    }

    /**
     * @callback callback
     */
    static async db(callback) {
      let clientMongo = await mongoClient.connect()
      try {
        await callback(clientMongo)
      } catch(e) {
        console.log(e)
      }
    }
    
    /**
     * @param { String } letter - letra para retornar o unicode
     * @return { String } - unicode
     */
    static regional(letter)  {
      if (!letter || typeof letter !== 'string') throw new TypeError("Informe uma string valida 'regional'")
      return Unicodes.get(`regional_indicator_${letter[0].toLowerCase()}`).unicode
    }
    /**
     * @param { String } link - string para pegar a url
     * @param { String } flags - flags para o regex
     * @returns { Object }
     * @description exemplo retorno {
          0: "https://www.youtube.com/watch?v=p2cEcdA7gEM",
          1: "https",
          2: "www.",
          3: "www",
          4: "youtube",
          5: "com",
          6: "/watch?v=p2cEcdA7gEM",
          groups: {subDomínio: 'www', domínio: 'youtube', TLD: 'com', caminho: '/watch?v=p2cEcdA7gEM'},
          index: 0,
          input: "https://www.youtube.com/watch?v=p2cEcdA7gEM",
          length: 7
      }
     */
    static regexLink(link, flags) {
      if (typeof link !== 'string') throw new TypeError("O link não é uma string, 'regexLink'")

      return link.match(/(https?)?:\/\/((?<subDominio>www)\.)?(?<dominio>[-a-zA-Z0-9@:%._\+~#=]{1,256})\.(?<TLD>[a-zA-Z0-9()]{1,6})\b(?<caminho>[-a-zA-Z0-9()@:%_\+.~#?&//=]*)/, flags)
    }
  }