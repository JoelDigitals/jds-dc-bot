const db = require('../../database/schema');

async function handleCounting(message) {
  if (message.author.bot) return;

  const settings = await db.getSettings(message.guild.id);
  if (!settings.counting_enabled) return;

  const count = await db.getCounting(message.channel.id);
  if (!count) return;

  const num = parseInt(message.content);
  if (isNaN(num)) {
    await message.delete().catch(() => {});
    return;
  }

  const expected = count.current_count + 1;

  if (num !== expected) {
    await message.delete().catch(() => {});
    const reply = await message.channel.send(`❌ ${message.author}, die nächste Zahl wäre **${expected}** gewesen!`);
    setTimeout(() => reply.delete().catch(() => {}), 5000);
    return;
  }

  if (message.author.id === count.last_user_id) {
    await message.delete().catch(() => {});
    const reply = await message.channel.send(`❌ ${message.author}, du darfst nicht zweimal hintereinander zählen!`);
    setTimeout(() => reply.delete().catch(() => {}), 5000);
    return;
  }

  await db.updateCounting(message.channel.id, num, message.author.id);

  // Milestone reactions
  if (num % 100 === 0) {
    message.react('🎉');
    message.channel.send(`🎉 **${num}** erreicht!`);
  } else if (num % 50 === 0) {
    message.react('🌟');
  } else if (num % 10 === 0) {
    message.react('✅');
  }
}

module.exports = { handleCounting };
