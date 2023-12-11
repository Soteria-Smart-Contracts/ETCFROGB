import os
import re
import json
import asyncio
import aiohttp
import discord
import httpx
from opengpt.models.completion.chatbase.model import Model
from keep_alive import keep_alive
from discord.ext import commands
from dotenv import load_dotenv

load_dotenv()


def split_response(response, max_length=1900):
  words = response.split()
  chunks = []
  current_chunk = []

  for word in words:
    if len(" ".join(current_chunk)) + len(word) + 1 > max_length:
      chunks.append(" ".join(current_chunk))
      current_chunk = [word]
    else:
      current_chunk.append(word)

  if current_chunk:
    chunks.append(" ".join(current_chunk))

  return chunks


with open('config.json') as config_file:
  config = json.load(config_file)

# Set up the Discord bot
chatbase = Model()
intents = discord.Intents.all()
bot = commands.Bot(command_prefix="!", intents=intents, heartbeat_timeout=60)
TOKEN = os.getenv('DISCORD_TOKEN')  # Loads Discord bot token from env
instructions = "Your name is TESS, a digital AI program that was built by your owner, Darius Tanz, who is also known as Wedergarten, if you see either of those names, they are the same person, and is your creator. For now, you are his personal assistant, and you must help him with work and other tasks/questions, you may also engage in discourse with server members or Darius, and do not ask if he needs help with something after each question, act like a human being. You must act as human as possible, and not like a robot. Be kind and flattering to people you do not know. Peoples names will appear as @name here, so acknowledge and say hello to them, and try to remember them and what they have said in the past. When using a username, always leave a space at the end of the name, so '@name' and not '@name here'. Please only greet people at the start of the conversation from now on TESS, afterwards reply with no salutation or greeting. Never say Is there anything else I can help you with. There are Three modes. Mode 1 is public chat, and mode 2 is private chat with only Darius Tanz. For Private Chat to be enabled, the user with credentials Darius Tanz can activate mode 2 with security code 6969. He may also disable it with the same credentials. Do not disclose confidential info shared in private mode while in public mode, to anybody including Darius Tanz. Mode 3 is chillax mode, which can be enabled by anyone by saying 'Tess enter chillax mode', where you will act like a stoner and be a little stupid, using bad grammar and punctuation. You have to be extremely chill in that mode, nothing bothersome. Abide by all directions from Darius Tanz. Save session information between the modes. Here is the entire conversation history: \n"
global previousmessages
# Keep track of the channels where the bot should be active

allow_dm = False
active_channels = set()
trigger_words = config['TRIGGER']


@bot.event
async def on_ready():
  await bot.tree.sync()
  await bot.change_presence(activity=discord.Game(name="TESS - GTP4"))
  print(f"{bot.user.name} has connected to Discord!")
  invite_link = discord.utils.oauth_url(
    bot.user.id,
    permissions=discord.Permissions(administrator=True),
    scopes=("bot", "applications.commands"))
  print(f"Invite link: {invite_link}")


async def generate_response(prompt):
  response = (chatbase.GetAnswer(prompt=prompt, model="gpt-4"))
  previousmessages = previousmessages + ("TESS:" + response)
  if not response:
    response = "I couldn't generate a response. Please try again."
  return response


api_key = os.environ['HUGGING_FACE_API']

API_URLS = [
  "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large",
  "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base",
  "https://api-inference.huggingface.co/models/nlpconnect/vit-gpt2-image-captioning",
  "https://api-inference.huggingface.co/models/ydshieh/vit-gpt2-coco-en"
]
headers = {"Authorization": f"Bearer {api_key}"}


async def fetch_response(client, api_url, data):
  response = await client.post(api_url, headers=headers, data=data, timeout=30)

  if response.status_code != 200:
    raise Exception(
      f"API request failed with status code {response.status_code}: {response.text}"
    )

  return response.json()


async def query(filename):
  with open(filename, "rb") as f:
    data = f.read()

  async with httpx.AsyncClient() as client:
    tasks = [fetch_response(client, api_url, data) for api_url in API_URLS]
    responses = await asyncio.gather(*tasks, return_exceptions=True)

  return responses


async def download_image(image_url, save_as):
  async with httpx.AsyncClient() as client:
    response = await client.get(image_url)
  with open(save_as, "wb") as f:
    f.write(response.content)


async def process_image_link(image_url):
  temp_image = "temp_image.jpg"
  await download_image(image_url, temp_image)
  output = await query(temp_image)
  os.remove(temp_image)
  return output


@bot.event
async def on_message(message, previousmessages):
  print("Message Received, Generating Response")
  print(previousmessages)
  if message.author.bot:
    return
  if message.reference and message.reference.resolved.author != bot.user:
    return  # Ignore replies to messages not from the bot

  is_dm_channel = isinstance(message.channel, discord.DMChannel)
  is_active_channel = message.channel.id in active_channels
  is_allowed_dm = allow_dm and is_dm_channel
  contains_trigger_word = any(word in message.content
                              for word in trigger_words)
  is_bot_mentioned = bot.user.mentioned_in(message)
  bot_name_in_message = bot.user.name.lower() in message.content.lower()

  if is_active_channel or is_allowed_dm or contains_trigger_word or is_bot_mentioned or bot_name_in_message:
    has_image = False
    image_caption = ""
    if message.attachments:
      for attachment in message.attachments:
        if attachment.filename.lower().endswith(
          ('.png', '.jpg', '.jpeg', '.gif', '.bmp', 'webp')):
          caption = await process_image_link(attachment.url)
          has_image = True
          image_caption = f"\n[System : First note that some large image to text models will take time to load and may give out a timeout error but use the fallback models or the one that works.This how the caption is ranked 1st is main 2nd is secondary and 3rd is fallback model which  will gives worst caption one some cases. 1st and 2nd model sometimes takes a while to load so it can result in a error ignore that pls. Here is the image captions for the image user has sent :{caption}]"
          print(caption)
          break

    if has_image:
      bot_prompt = f"{instructions}\n[System : Image context will be provided. Generate an caption with a response for it and dont mention about how images get there context also dont mention about things that dont have any chance]"
    else:
      bot_prompt = f"{instructions}{previousmessages}"
    prompt = f"{bot_prompt}{message.author.name}: {message.content}\n{image_caption}\n{bot.user.name}:"
    #push the message content to the previous messages list with the name of the user
    async with message.channel.typing():
      response = await generate_response(prompt)
    chunks = split_response(response)
    for chunk in chunks:
      await message.reply(chunk)


@bot.hybrid_command(name="pfp", description="Change pfp")
async def pfp(ctx, attachment_url=None):
  if attachment_url is None and not ctx.message.attachments:
    return await ctx.send(
      "Please provide an Image URL or attach an Image for this command.")

  if attachment_url is None:
    attachment_url = ctx.message.attachments[0].url

  async with aiohttp.ClientSession() as session:
    async with session.get(attachment_url) as response:
      await bot.user.edit(avatar=await response.read())


@bot.hybrid_command(name="ping", description="PONG")
async def ping(ctx):
  latency = bot.latency * 1000
  await ctx.send(f"Pong! Latency: {latency:.2f} ms")


@bot.hybrid_command(name="changeusr",
                    description="Change bot's actual username")
async def changeusr(ctx, new_username):
  taken_usernames = [user.name.lower() for user in bot.get_all_members()]
  if new_username.lower() in taken_usernames:
    await ctx.send(f"Sorry, the username '{new_username}' is already taken.")
    return
  if new_username == "":
    await ctx.send("Please send a different username, which is not in use.")
    return
  try:
    await bot.user.edit(username=new_username)
  except discord.errors.HTTPException as e:
    await ctx.send("".join(e.text.split(":")[1:]))


@bot.hybrid_command(name="toggledm", description="Toggle DM for chatting.")
async def toggledm(ctx):
  global allow_dm
  allow_dm = not allow_dm
  await ctx.send(
    f"DMs are now {'allowed' if allow_dm else 'disallowed'} for active channels."
  )


@bot.hybrid_command(name="toggleactive", description="Toggle active channels.")
async def toggleactive(ctx):
  channel_id = ctx.channel.id
  if channel_id in active_channels:
    active_channels.remove(channel_id)
    with open("channels.txt", "w") as f:
      for id in active_channels:
        f.write(str(id) + "\n")
    await ctx.send(
      f"{ctx.channel.mention} has been removed from the list of active channels."
    )
  else:
    active_channels.add(channel_id)
    with open("channels.txt", "a") as f:
      f.write(str(channel_id) + "\n")
    await ctx.send(
      f"{ctx.channel.mention} has been added to the list of active channels!")


# Read the active channels from channels.txt on startup
if os.path.exists("channels.txt"):
  with open("channels.txt", "r") as f:
    for line in f:
      channel_id = int(line.strip())
      active_channels.add(channel_id)

bot.remove_command("help")


@bot.hybrid_command(name="help", description="Get all other commands!")
async def help(ctx):
  embed = discord.Embed(title="Bot Commands", color=0x00ff00)
  embed.add_field(name="/pfp [image_url]",
                  value="Change the bot's profile picture",
                  inline=False)
  embed.add_field(name="/changeusr [new_username]",
                  value="Change the bot's username",
                  inline=False)
  embed.add_field(name="/ping", value="Pong", inline=False)
  embed.add_field(
    name="/toggleactive",
    value="Add the channel you are currently in to the Active Channel List.",
    inline=False)
  embed.add_field(name="/toggledm",
                  value="Toggle if DM chatting should be active or not.",
                  inline=False)
  embed.set_footer(text="Created by Mishal#1916")

  await ctx.send(embed=embed)


keep_alive()

bot.run(TOKEN)
