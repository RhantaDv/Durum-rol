const { Client, IntentsBitField, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ActivityType } = require('discord.js');
const config = require('./config.json');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildPresences,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent
  ]
});

client.on('ready', () => {
  console.log(`${client.user.tag} aktif!`);

  client.user.setStatus(config.status || 'online');
  if (config.ready) {
    client.user.setActivity(config.ready, { type: ActivityType.Playing });
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'yardım' || command === 'help') {
    const embed = new EmbedBuilder()
      .setTitle('Yardım Menüsü')
      .setDescription('Durum Rol Botu Komutları')
      .addFields(
        { name: `${config.prefix}durumrol-ayarla`, value: `Durum rolünü ayarlar. Örnek: \`${config.prefix}durumrol-ayarla "İstediğiniz Mesaj" @verified\`` },
        { name: `${config.prefix}durumrol-kapat`, value: 'Durum rol sistemini kapatır.' },
        { name: `${config.prefix}durumrol-log`, value: `Log kanalını ayarlar. Örnek: \`${config.prefix}durumrol-log #log-kanalı\`` },
        { name: `${config.prefix}durumrol-log-kapat`, value: 'Log sistemini kapatır.' },
        { name: `${config.prefix}durumrol-status`, value: 'Durum-rol ve Durum-log sistemlerinin durumunu ve rolü alan kişi sayısını gösterir.' }
      )
      .setColor('#0099ff')
      .setTimestamp();
    await message.channel.send({ embeds: [embed] });
  }

  if (command === 'durumrol-ayarla') {
    if (!message.member.permissions.has('ManageRoles')) {
      return message.reply('Bu komutu kullanmak için rol yönetme izniniz olmalı!');
    }

    if (args.length < 2) {
      return message.reply(`Kullanım: \`${config.prefix}durumrol-ayarla "Durum Mesajı" @rol\``);
    }

    const durumMesaj = args[0].replace(/"/g, '');
    const rol = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);

    if (!rol) {
      return message.reply('Geçerli bir rol belirtmelisiniz!');
    }

    message.guild.client.durumRol = { durum: durumMesaj, rolId: rol.id };
    await message.reply(`Durum rolü ayarlandı: **${durumMesaj}** durumuna **${rol.name}** rolü verilecek.`);
  }

  if (command === 'durumrol-kapat') {
    if (!message.member.permissions.has('ManageRoles')) {
      return message.reply('Bu komutu kullanmak için rol yönetme izniniz olmalı!');
    }

    message.guild.client.durumRol = null;
    await message.reply('Durum rol sistemi kapatıldı.');
  }

  if (command === 'durumrol-log') {
    if (!message.member.permissions.has('ManageRoles')) {
      return message.reply('Bu komutu kullanmak için rol yönetme izniniz olmalı!');
    }

    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply(`Kullanım: \`${config.prefix}durumrol-log #log-kanalı\``);
    }

    message.guild.client.logChannel = channel.id;
    await message.reply(`Log kanalı <#${channel.id}> olarak ayarlandı.`);
  }

  if (command === 'durumrol-log-kapat') {
    if (!message.member.permissions.has('ManageRoles')) {
      return message.reply('Bu komutu kullanmak için rol yönetme izniniz olmalı!');
    }

    message.guild.client.logChannel = null;
    await message.reply('Log sistemi kapatıldı.');
  }

  if (command === 'durumrol-status') {
    if (!message.member.permissions.has('ManageRoles')) {
      return message.reply('Bu komutu kullanmak için rol yönetme izniniz olmalı!');
    }

    const durumRol = message.guild.client.durumRol;
    const logChannel = message.guild.client.logChannel;
    const rol = durumRol ? message.guild.roles.cache.get(durumRol.rolId) : null;
    const memberCount = rol ? message.guild.members.cache.filter(m => m.roles.cache.has(durumRol.rolId)).size : 0;

    const embed = new EmbedBuilder()
      .setTitle('Durum Sistemi Durumu')
      .addFields(
        { name: 'Durum-Rol Sistemi', value: durumRol ? 'Açık' : 'Kapalı', inline: true },
        { name: 'Durum-Log Sistemi', value: logChannel ? 'Açık' : 'Kapalı', inline: true },
        { name: 'Rolü Alan Kişi Sayısı', value: memberCount.toString(), inline: true }
      )
      .setColor('#0099ff')
      .setTimestamp();
    await message.channel.send({ embeds: [embed] });
  }
});

client.on('presenceUpdate', async (oldPresence, newPresence) => {
  const member = newPresence.member;
  const guild = member.guild;

  if (!guild.client.durumRol) return;

  const { durum, rolId } = guild.client.durumRol;
  const rol = guild.roles.cache.get(rolId);
  if (!rol) return;

  const status = newPresence.activities.some(activity => activity.state && activity.state.includes(durum));
  const logChannel = guild.client.logChannel ? guild.channels.cache.get(guild.client.logChannel) : null;
  const currentDate = new Date().toLocaleString('tr-TR', { 
    hour: '2-digit', 
    minute: '2-digit', 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });

  if (status) {
    if (!member.roles.cache.has(rolId)) {
      await member.roles.add(rolId).catch(console.error);
      
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('Durum Rolü Eklendi')
          .addFields(
            { name: 'Durumu Alan', value: `${member}`, inline: true },
            { name: 'Verilen Rol', value: `${rol.name}`, inline: true },
            { name: 'Aldığı Tarih', value: currentDate, inline: true }
          )
          .setColor('#00ff00')
          .setTimestamp();
        await logChannel.send({ embeds: [embed] });
      }
    }
  } else {
    if (member.roles.cache.has(rolId)) {
      await member.roles.remove(rolId).catch(console.error);
      
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('Durum Rolü Kaldırıldı')
          .addFields(
            { name: 'Durumu Çıkartan', value: `${member}`, inline: true },
            { name: 'Alınan Rol', value: `${rol.name}`, inline: true },
            { name: 'Çıkarttığı Tarih', value: currentDate, inline: true }
          )
          .setColor('#ff0000')
          .setTimestamp();
        await logChannel.send({ embeds: [embed] });
      }
    }
  }
});

client.login(config.token);