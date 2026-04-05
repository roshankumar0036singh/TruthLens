import os
import discord
from discord import app_commands
from discord.ext import commands
import asyncio
from typing import Dict, Any
from agents.orchestrator import orchestrator

class TruthLensBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(command_prefix="!", intents=intents)
        self.alert_channel_id = None # Set via command or env

    async def setup_hook(self):
        # Sync Slash Commands
        await self.tree.sync()
        print(f"TruthLens Sentinel: Commands Synced.")

    async def on_ready(self):
        print(f"TruthLens Sentinel: Logged in as {self.user} (ID: {self.user.id})")
        print("------")

    async def broadcast_alert(self, data: Dict[str, Any]):
        """Broadcast an alert from the Sentinel Service."""
        # For now, broadcasting to all guilds the bot is in
        # In production, this would be a specific 'truth-alerts' channel.
        for guild in self.guilds:
            channel = discord.utils.get(guild.text_channels, name="truth-scanner")
            if channel:
                embed = discord.Embed(
                    title="🚨 TRUTHLENS CRITICAL ALERT",
                    description=f"**Viral Misinformation Detected:**\n\"{data['claim'][:300]}\"",
                    color=0xEF4444
                )
                embed.add_field(name="Verdict", value=f"**{data['verdict']}**", inline=True)
                embed.add_field(name="Confidence", value=f"**{data['confidence']:.1f}%**", inline=True)
                embed.add_field(name="Forensic Insight", value=data['insight'], inline=False)
                embed.add_field(name="On-Chain Evidence", value=f"[`{data['tx_hash'][:10]}...`](https://explorer-mezame.shardeum.org/tx/{data['tx_hash']})", inline=False)
                embed.set_footer(text="Distributed by TruthLens Autonomous Sentinel • Shardeum Mezzame")
                
                await channel.send(embed=embed)

bot = TruthLensBot()

@bot.tree.command(name="verify", description="Analyze a claim or URL with TruthLens Swarm Intelligence")
@app_commands.describe(claim="The text or link you want to verify", attachment="Optional image/file to scan alongside text")
async def verify(interaction: discord.Interaction, claim: str = None, attachment: discord.Attachment = None):
    await interaction.response.defer()
    
    # 1. Resolve Input
    input_text = claim or (attachment.filename if attachment else "Media Analysis Request")
    media_urls = [attachment.url] if attachment else []
    
    try:
        # Trigger Swarm Intelligence
        result = await orchestrator.dispatch_parallel({
            "text": input_text,
            "media_urls": media_urls
        })
        verdict = result.get("final_verdict", {})
        
        # Build Embed
        color = 0xA3E635 if verdict.get("verdict") == "VERIFIED" else (0xEF4444 if verdict.get("verdict") == "FALSE" else 0xFBBF24)
        
        embed = discord.Embed(
            title=f"TruthLens Verdict: {verdict.get('verdict', 'MIXED')}",
            description=f"**Analysis of:** \"{input_text[:200]}...\"",
            color=color
        )
        
        if attachment:
            embed.set_thumbnail(url=attachment.url)

        embed.add_field(name="Confidence", value=f"**{verdict.get('confidence_score', 0):.1f}%**", inline=True)
        embed.add_field(name="Latency", value=f"**{verdict.get('latency', 0):.2f}s**", inline=True)
        embed.add_field(name="Human Explanation", value=verdict.get("human_explanation", "No detailed reasoning provided."), inline=False)
        
        if verdict.get("key_reasons"):
            embed.add_field(name="Key Signals", value="\n".join([f"• {r}" for r in verdict.get("key_reasons")[:3]]), inline=False)
            
        embed.set_footer(text="Verified by TruthLens Swarm Intelligence • Shardeum Mezzame")
        
        await interaction.followup.send(embed=embed)
        
    except Exception as e:
        await interaction.followup.send(f"⚠️ **TruthLens Error:** Failed to resolve swarm. ({str(e)})")

@bot.tree.command(name="media", description="Perform deepfake and forensic scan on an image")
@app_commands.describe(url="Optional image URL", attachment="Upload an image file directly")
async def media(interaction: discord.Interaction, url: str = None, attachment: discord.Attachment = None):
    await interaction.response.defer()
    
    target_url = attachment.url if attachment else url
    if not target_url:
        await interaction.followup.send("❌ Please provide either an image **URL** or **Upload** a file.")
        return

    try:
        # Trigger Media Forensics Agent specifically
        result = await orchestrator.dispatch_parallel({
            "text": "User Media Scan Request", 
            "media_urls": [target_url]
        })
        forensics = result.get("detailed_reports", {}).get("MediaForensics", {})
        
        if not forensics or not forensics.get("media_analyzed"):
            await interaction.followup.send("❌ **TruthLens Error:** Could not analyze provided media.")
            return

        embed = discord.Embed(
            title="Media Forensic Report",
            description=f"**Target:** `{target_url[:50]}...`",
            color=0x3B82F6
        )
        
        embed.set_image(url=target_url)
        embed.add_field(name="Forensic Score", value=f"**{forensics.get('forensic_score', 0)}/100**", inline=True)
        embed.add_field(name="AI Generated", value="**YES 🤖**" if forensics.get("is_ai_generated") else "**NO 👤**", inline=True)
        
        if forensics.get("forensic_flags"):
            embed.add_field(name="Forensic Flags", value="\n".join([f"🚩 {f}" for f in forensics.get("forensic_flags")]), inline=False)
            
        embed.set_footer(text="Forensic Scan • Powered by Gemini Vision & TruthLens Swarm")
        
        await interaction.followup.send(embed=embed)
        
    except Exception as e:
        await interaction.followup.send(f"⚠️ **TruthLens Media Error:** {str(e)}")

async def start_discord_bot():
    # Support both DISCORD_TOKEN and DISCORD_BOT_TOKEN
    token = os.getenv("DISCORD_BOT_TOKEN") or os.getenv("DISCORD_TOKEN")
    if not token:
        print("TruthLens Sentinel: DISCORD_TOKEN not found. Bot suspended.")
        return
    
    try:
        await bot.start(token)
    except Exception as e:
        print(f"TruthLens Sentinel Connection Error: {e}")
