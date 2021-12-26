const Interaction = require('../../Structures/Interaction.js')
const schedule = require('node-schedule');
const fnArr = (len) => Array.from({ length: len }, (a, i) => {
  return {
    name: `${i+1}`,
    value: i+1
  }  
});
const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js')

module.exports = class LembreteInteraction extends Interaction {
  constructor() {
    super("lembrete", {
      type: 1,
      description: 'Fazer com que o bot te lembre algo daqui um tempo (vai adicionando e não uma data do calendário)',
      defaultPermission: true,
      options: [
        {
          name: "lembrete",
          description: "Lembrete para ser enviado na sua DM",
          type: "STRING",
          required: true
        },
        {
          name: 'mês',
          description: 'Mês (1 - 12)',
          type: "INTEGER",
          required: false,
          choices: fnArr(12)
        },
        {
          name: 'dia_do_mês',
          description: 'Dia do mês (1 - 31)',
          type: "INTEGER",
          required: false
        },
        {
          name: 'dia_da_semana',
          description: 'Dia da semana (0 - 7) (0 é Domingo)',
          type: "INTEGER",
          required: false,
          choices: [
            {
              name: "0",
              value: 0
            },
            {
              name: "1",
              value: 1
            },
            {
              name: "2",
              value: 2
            },
            {
              name: "3",
              value: 3
            },
            {
              name: "4",
              value: 4
            },
            {
              name: "5",
              value: 5
            },
            {
              name: "6",
              value: 6
            }
          ]
        },
        {
          name: 'hora',
          description: 'Hora (0 - 23)',
          type: "INTEGER",
          required: false,
          choices: fnArr(23)
        },
        {
          name: 'minuto',
          description: 'Minuto (0 - 59)',
          type: "INTEGER",
          required: false
        },
        {
          name: 'segundo',
          description: 'segundo (0 - 59)',
          type: "INTEGER",
          required: false
        }
      ],
      channelTypes: ["GUILD_TEXT", "DM"],
      beta: true
    })
  }

  async execute({ interaction, args, client }) {
    await interaction.deferReply({
      ephemeral: true
    })

    const dayOfWeek = args.getInteger('dia_da_semana'),
    month = args.getInteger('mês'),
    dayOfMonth = args.getInteger('dia_do_mês'),
    hour = args.getInteger('hora'),
    minute = args.getInteger('minuto'),
    second = args.getInteger('segundo'),
    lembrete = args.getString('lembrete');

    if ((minute ?? second) > 59) return await interaction.followUp(":x: Minuto ou segundo maior que 59!")
    if (dayOfMonth && (dayOfMonth > 31 || dayOfMonth < 1)) return await interaction.followUp(':x: Dia do mês inválido!')
    if (![dayOfMonth, dayOfWeek, month, hour, minute, second].some(a => a ? true : false)) return await interaction.followUp(":x: Informe algum dos valores (mês, dia_do_mês, hora ...) para poder agendar seu lembrete!")

    let _jobCache = schedule.scheduleJob(`${second||"*"} ${minute||"*"} ${hour||"*"} ${dayOfMonth||"*"} ${month||"*"} ${dayOfWeek||"*"}`, () => {})
    const data = Date.parse(_jobCache.nextInvocation()) / 1000


    _jobCache.cancel()
    
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('confirm')
          .setEmoji('✅')
          .setStyle('SUCCESS'),

        new MessageButton()
          .setCustomId('cancel')
          .setEmoji('❌')
          .setStyle('DANGER')
      )

    const mes = await interaction.followUp({
      components: [row],
      embeds: [
        new MessageEmbed()
          .setDescription("Quer mesmo adicionar esse lembrete?")
          .addField('Data', `<t:${data}:F>`, true)
          .addField('Lembrete', lembrete, true)
          .setColor('#2F3136')
      ]
    })

    let filter = (i) => ['confirm', 'cancel'].includes(i.customId);
    const collector = mes.createMessageComponentCollector({
      filter,
      idle: 20000
    })

    collector.on('collect', async (i) => {
      for (let o of row.components) o.setDisabled(true);

      if (i.customId == 'confirm') {
        const job = schedule.scheduleJob(`${second||"*"} ${minute||"*"} ${hour||"*"} ${dayOfMonth||"*"} ${month||"*"} ${dayOfWeek||"*"}`,
          async function(d) {
            try {
              const dm = await interaction.user.createDM()
              await dm.send(lembrete)
            } catch(e) {
              console.error(e)
            } finally {
              job.cancel()
            }
        })

        return await i.update({
          content: `Lembrete agendado para <t:${data}:F>, caso sua dm esteja fechada não será possível enviar o lembrete.`,
          components: [row]
        })
      } else await i.update({
        content: "Cancelado",
        components: [row]
      })
    })
  }
}