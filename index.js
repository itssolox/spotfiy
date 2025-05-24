const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// Bot configuration
const bot = new Telegraf('7988228041:AAGqEA2IEjAKJcyDc-RB_EBdrlll8mH_bBc');
const CHANNEL_LINK = 'https://t.me/+Jj-2MqY4DbUzZGZl';
const CHANNEL_ID = -1002697504696;
const ADMIN_ID = 6994528708;
const REWARD_CHANNEL_LINK = 'https://t.me/+g-xrzWHWZcUzODA1';
const REQUIRED_REFERRALS = 4;

// Ensure data files exist
if (!fs.existsSync('./users.json')) {
  fs.writeFileSync('./users.json', JSON.stringify({}));
}

// Helper functions for user data management
const getUserData = () => {
  try {
    return JSON.parse(fs.readFileSync('./users.json', 'utf8'));
  } catch (error) {
    console.error('Error reading user data:', error);
    return {};
  }
};

const saveUserData = (data) => {
  try {
    fs.writeFileSync('./users.json', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

const getUser = (userId) => {
  const users = getUserData();
  if (!users[userId]) {
    users[userId] = {
      userId,
      username: '',
      hasJoined: false,
      points: 0,
      referrals: [],
      referredBy: null,
      hasReceivedReward: false,
      joinedAt: null
    };
    saveUserData(users);
  }
  return users[userId];
};

const updateUser = (userId, updates) => {
  const users = getUserData();
  users[userId] = { ...users[userId], ...updates };
  saveUserData(users);
  return users[userId];
};

// Notify user when someone joined using their referral link
const notifyReferrer = async (ctx, referrerId, referredUser) => {
  try {
    await ctx.telegram.sendMessage(
      referrerId,
      `🎉 *New Referral!*\n\n` +
      `👤 A new user joined using your referral link!\n` +
      `📊 Keep sharing your link to earn the Spotify Premium method.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error sending referral notification:', error);
  }
};

// Check if user has joined the channel
const checkMembership = async (ctx) => {
  try {
    const userId = ctx.from.id;
    const member = await ctx.telegram.getChatMember(CHANNEL_ID, userId);
    return ['creator', 'administrator', 'member'].includes(member.status);
  } catch (error) {
    console.error('Error checking membership:', error);
    return false;
  }
};

// Main menu keyboard
const getMainKeyboard = () => {
  return Markup.keyboard([
    ['📊 My Points', '👥 Refer Friends', '💰 Withdraw Reward'],
  ]).resize();
};

// Start command handler
bot.start(async (ctx) => {
  try {
    const userId = ctx.from.id;
    const user = getUser(userId);
    
    // Handle referral
    const startPayload = ctx.startPayload;
    if (startPayload && startPayload !== userId.toString()) {
      const referrerId = startPayload;
      const referrer = getUser(referrerId);
      
      if (referrer && !user.referredBy && userId.toString() !== referrerId) {
        user.referredBy = referrerId;
        updateUser(userId, { referredBy: referrerId });
        
        // Let's store the username or user ID to inform referrer later
        const referredUsername = ctx.from.username ? '@' + ctx.from.username : 'User ' + userId;
        updateUser(userId, { username: referredUsername });
      }
    }
    
    // Save username if available
    if (ctx.from.username) {
      updateUser(userId, { username: ctx.from.username });
    }
    
    // Welcome message with force join button
    await ctx.reply(
      `🎵 *Welcome to Spotify Premium Bot* 🎵\n\nTo access the exclusive Spotify Premium method, you need to join our channel first!`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.url('📢 Join Channel', CHANNEL_LINK),
          Markup.button.callback('✅ I\'ve Joined', 'check_joined')
        ])
      }
    );
  } catch (error) {
    console.error('Error in start command:', error);
    ctx.reply('Sorry, something went wrong. Please try again later.');
  }
});

// Check if user has joined the channel
bot.action('check_joined', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const hasJoined = await checkMembership(ctx);
    
    if (hasJoined) {
      // Update user data
      const user = updateUser(userId, { 
        hasJoined: true,
        joinedAt: new Date().toISOString() 
      });
      
      // Credit referrer if exists
      if (user.referredBy) {
        const referrer = getUser(user.referredBy);
        if (referrer) {
          const referrerUpdates = {
            points: referrer.points + 1,
            referrals: [...referrer.referrals, userId]
          };
          updateUser(user.referredBy, referrerUpdates);
          
          // Notify referrer about new referral
          await notifyReferrer(ctx, user.referredBy, ctx.from);
        }
      }
      
      // Send success message and instructions
      await ctx.editMessageText(
        `✅ *Channel Joined Successfully!*\n\n` +
        `🎉 Welcome to our Spotify Premium community! Here's how to get your free Spotify Premium method:\n\n` +
        `1️⃣ Refer 4 friends to this bot using your personal link\n` +
        `2️⃣ Each friend must join our channel\n` +
        `3️⃣ Once you reach 4 referrals, you can withdraw your reward\n` +
        `4️⃣ You'll get exclusive access to our Spotify Premium method\n\n` +
        `🔗 Your referral link (tap to copy):\n` +
        `\`https://t.me/${ctx.botInfo.username}?start=${userId}\``,
        {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        }
      );
      
      // Send main menu
      await ctx.reply('Select an option:', getMainKeyboard());
      
    } else {
      // User has not joined
      await ctx.answerCbQuery('❌ You need to join the channel first!', { show_alert: true });
    }
  } catch (error) {
    console.error('Error checking join status:', error);
    ctx.reply('Sorry, something went wrong. Please try again.');
  }
});

// Handle "My Points" button
bot.hears('📊 My Points', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const user = getUser(userId);
    
    // Check if user has properly joined
    const hasJoined = await checkMembership(ctx);
    if (!hasJoined) {
      return ctx.reply(
        '❌ You need to join our channel first!',
        Markup.inlineKeyboard([
          Markup.button.url('📢 Join Channel', CHANNEL_LINK),
          Markup.button.callback('✅ I\'ve Joined', 'check_joined')
        ])
      );
    }
    
    const referralsCount = user.referrals.length;
    const pointsNeeded = REQUIRED_REFERRALS - referralsCount;
    
    await ctx.reply(
      `📊 *Your Points Summary*\n\n` +
      `👥 Referrals: ${referralsCount}/${REQUIRED_REFERRALS}\n` +
      `🎯 Progress: ${Math.min(100, Math.round((referralsCount / REQUIRED_REFERRALS) * 100))}%\n` +
      `${pointsNeeded > 0 ? `🔄 You need ${pointsNeeded} more referral${pointsNeeded !== 1 ? 's' : ''} to get the reward!\n\n` : '✅ You can now withdraw your reward!\n\n'}` +
      `🔗 Your referral link (tap to copy):\n` +
      `\`https://t.me/${ctx.botInfo.username}?start=${userId}\``,
      {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      }
    );
  } catch (error) {
    console.error('Error in My Points:', error);
    ctx.reply('Sorry, something went wrong. Please try again later.');
  }
});

// Handle "Refer Friends" button
bot.hears('👥 Refer Friends', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const user = getUser(userId);
    
    // Check if user has properly joined
    const hasJoined = await checkMembership(ctx);
    if (!hasJoined) {
      return ctx.reply(
        '❌ You need to join our channel first!',
        Markup.inlineKeyboard([
          Markup.button.url('📢 Join Channel', CHANNEL_LINK),
          Markup.button.callback('✅ I\'ve Joined', 'check_joined')
        ])
      );
    }
    
    const referralsCount = user.referrals.length;
    const remainingReferrals = REQUIRED_REFERRALS - referralsCount;
    
    await ctx.reply(
      `👥 *Refer Friends & Earn Rewards*\n\n` +
      `📱 Share your unique referral link with friends:\n\n` +
      `🔗 Tap to copy:\n` +
      `\`https://t.me/${ctx.botInfo.username}?start=${userId}\`\n\n` +
      `📊 Current progress: ${referralsCount}/${REQUIRED_REFERRALS} referrals\n` +
      `${remainingReferrals > 0 ? `🎯 You need ${remainingReferrals} more friend${remainingReferrals !== 1 ? 's' : ''} to get the Spotify Premium method!` : '🎉 You\'ve reached the required referrals! You can now withdraw your reward.'}`,
      {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...Markup.inlineKeyboard([
          Markup.button.callback('🔄 Refresh Status', 'refresh_status')
        ])
      }
    );
  } catch (error) {
    console.error('Error in Refer Friends:', error);
    ctx.reply('Sorry, something went wrong. Please try again later.');
  }
});

// Handle status refresh
bot.action('refresh_status', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const user = getUser(userId);
    const referralsCount = user.referrals.length;
    const remainingReferrals = REQUIRED_REFERRALS - referralsCount;
    
    await ctx.editMessageText(
      `👥 *Refer Friends & Earn Rewards*\n\n` +
      `📱 Share your unique referral link with friends:\n\n` +
      `🔗 Tap to copy:\n` +
      `\`https://t.me/${ctx.botInfo.username}?start=${userId}\`\n\n` +
      `📊 Current progress: ${referralsCount}/${REQUIRED_REFERRALS} referrals\n` +
      `${remainingReferrals > 0 ? `🎯 You need ${remainingReferrals} more friend${remainingReferrals !== 1 ? 's' : ''} to get the Spotify Premium method!` : '🎉 You\'ve reached the required referrals! You can now withdraw your reward.'}`,
      {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...Markup.inlineKeyboard([
          Markup.button.callback('🔄 Refresh Status', 'refresh_status')
        ])
      }
    );
    
    await ctx.answerCbQuery('✅ Status updated!');
  } catch (error) {
    console.error('Error refreshing status:', error);
    ctx.answerCbQuery('Sorry, something went wrong. Please try again.');
  }
});

// Handle "Withdraw Reward" button
bot.hears('💰 Withdraw Reward', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const user = getUser(userId);
    
    // Check if user has properly joined
    const hasJoined = await checkMembership(ctx);
    if (!hasJoined) {
      return ctx.reply(
        '❌ You need to join our channel first!',
        Markup.inlineKeyboard([
          Markup.button.url('📢 Join Channel', CHANNEL_LINK),
          Markup.button.callback('✅ I\'ve Joined', 'check_joined')
        ])
      );
    }
    
    const referralsCount = user.referrals.length;
    
    if (referralsCount >= REQUIRED_REFERRALS) {
      if (!user.hasReceivedReward) {
        // Update user data
        updateUser(userId, { hasReceivedReward: true });
        
        await ctx.reply(
          `🎉 *Congratulations!* 🎉\n\n` +
          `You've successfully referred ${referralsCount} friends and unlocked the Spotify Premium method!\n\n` +
          `🔗 *Here's your exclusive access link:*\n` +
          `${REWARD_CHANNEL_LINK}\n\n` +
          `⚠️ *Important:* Don't share this link with anyone else to keep the method working.`,
          {
            parse_mode: 'Markdown',
            disable_web_page_preview: true
          }
        );
      } else {
        await ctx.reply(
          `✅ You've already received your reward!\n\n` +
          `🔗 Here's your exclusive access link again:\n` +
          `${REWARD_CHANNEL_LINK}\n\n` +
          `⚠️ Remember: Don't share this link with anyone else to keep the method working.`,
          {
            disable_web_page_preview: true
          }
        );
      }
    } else {
      const neededReferrals = REQUIRED_REFERRALS - referralsCount;
      await ctx.reply(
        `❌ You don't have enough referrals yet!\n\n` +
        `👥 Your referrals: ${referralsCount}/${REQUIRED_REFERRALS}\n` +
        `🎯 You need ${neededReferrals} more referral${neededReferrals !== 1 ? 's' : ''} to withdraw the reward.\n\n` +
        `Share your referral link to get more friends:\n` +
        `\`https://t.me/${ctx.botInfo.username}?start=${userId}\``,
        {
          disable_web_page_preview: true
        }
      );
    }
  } catch (error) {
    console.error('Error in Withdraw Reward:', error);
    ctx.reply('Sorry, something went wrong. Please try again later.');
  }
});

// Admin commands
bot.command('admin', async (ctx) => {
  try {
    const userId = ctx.from.id;
    
    if (userId !== ADMIN_ID) {
      return ctx.reply('❌ You are not authorized to use admin commands.');
    }
    
    await ctx.reply(
      '👑 *Admin Panel*\n\n' +
      'Available commands:\n' +
      '/stats - Show bot statistics\n' +
      '/broadcast - Send message to all users\n',
      {
        parse_mode: 'Markdown',
      }
    );
  } catch (error) {
    console.error('Error in admin command:', error);
    ctx.reply('Sorry, something went wrong.');
  }
});

// Admin stats command
bot.command('stats', async (ctx) => {
  try {
    const userId = ctx.from.id;
    
    if (userId !== ADMIN_ID) {
      return;
    }
    
    const users = getUserData();
    const totalUsers = Object.keys(users).length;
    const joinedUsers = Object.values(users).filter(user => user.hasJoined).length;
    const completedUsers = Object.values(users).filter(user => user.hasReceivedReward).length;
    
    await ctx.reply(
      `📊 *Bot Statistics*\n\n` +
      `👥 Total users: ${totalUsers}\n` +
      `✅ Joined channel: ${joinedUsers}\n` +
      `🎁 Completed tasks: ${completedUsers}`,
      {
        parse_mode: 'Markdown'
      }
    );
  } catch (error) {
    console.error('Error in stats command:', error);
    ctx.reply('Sorry, something went wrong.');
  }
});

// Admin broadcast command - initiate broadcast
bot.command('broadcast', async (ctx) => {
  try {
    const userId = ctx.from.id;
    
    if (userId !== ADMIN_ID) {
      return;
    }
    
    await ctx.reply(
      '📣 *Broadcast Message*\n\n' +
      'Please send the message you want to broadcast to all users.\n' +
      'Reply to this message with your broadcast content.',
      {
        parse_mode: 'Markdown'
      }
    );
    
    // Set context to broadcast mode
    ctx.scene = 'broadcast';
  } catch (error) {
    console.error('Error in broadcast command:', error);
    ctx.reply('Sorry, something went wrong.');
  }
});

// Handle broadcast message
bot.on('message', async (ctx) => {
  try {
    const userId = ctx.from.id;
    
    // Check if in broadcast mode and is admin
    if (ctx.scene === 'broadcast' && userId === ADMIN_ID && ctx.message.reply_to_message) {
      const broadcastMessage = ctx.message.text;
      const users = getUserData();
      let sentCount = 0;
      let errorCount = 0;
      
      await ctx.reply('🚀 Starting broadcast...');
      
      // Send message to all users
      for (const userId in users) {
        try {
          await ctx.telegram.sendMessage(userId, 
            `📣 *ANNOUNCEMENT*\n\n${broadcastMessage}`, 
            { parse_mode: 'Markdown' }
          );
          sentCount++;
          
          // Add delay to avoid flood limits
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.error(`Error sending broadcast to ${userId}:`, error);
          errorCount++;
        }
      }
      
      await ctx.reply(
        `✅ Broadcast completed!\n\n` +
        `📨 Sent: ${sentCount}\n` +
        `❌ Failed: ${errorCount}`
      );
      
      // Clear broadcast mode
      delete ctx.scene;
    }
  } catch (error) {
    console.error('Error processing message:', error);
    if (ctx.from.id === ADMIN_ID) {
      ctx.reply('Sorry, something went wrong with the broadcast.');
    }
  }
});

// Help command
bot.help((ctx) => {
  ctx.reply(
    '🎵 *Spotify Premium Bot Help*\n\n' +
    '• /start - Start the bot\n' +
    '• 📊 My Points - Check your referral progress\n' +
    '• 👥 Refer Friends - Get your referral link\n' +
    '• 💰 Withdraw Reward - Get the Spotify Premium method\n\n' +
    'Need help? Contact @admin', // Replace with actual admin username
    {
      parse_mode: 'Markdown'
    }
  );
});

// Handle unsupported messages
bot.on('message', (ctx) => {
  const hasMainMenu = ctx.message && ['📊 My Points', '👥 Refer Friends', '💰 Withdraw Reward'].includes(ctx.message.text);
  if (!hasMainMenu) {
    ctx.reply('Please use the menu buttons below:', getMainKeyboard());
  }
});

// Start the bot
bot.launch().then(() => {
  console.log('Bot started successfully!');
}).catch((err) => {
  console.error('Failed to start bot:', err);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
