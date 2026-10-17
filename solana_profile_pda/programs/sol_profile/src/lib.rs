use anchor_lang::prelude::*;

declare_id!("99kG1uzN8NxctagzPbNYrnHAQNgGk68eaP6FpuBq6sTs");

/// Seed prefix for every profile PDA: ["profile", owner_wallet]
pub const PROFILE_SEED: &[u8] = b"profile";

pub const MAX_USERNAME_LEN: usize = 32;
pub const MAX_BIO_LEN: usize = 160;
pub const MAX_URL_LEN: usize = 100;

#[program]
pub mod sol_profile {
    use super::*;

    /// Creates a profile PDA bound to `owner` wallet.
    /// PDA = find_program_address(["profile", owner], program_id)
    pub fn create_profile(
        ctx: Context<CreateProfile>,
        username: String,
        bio: String,
        avatar_url: String,
    ) -> Result<()> {
        validate(&username, &bio, &avatar_url)?;

        let now = Clock::get()?.unix_timestamp;
        let profile = &mut ctx.accounts.profile;
        profile.owner = ctx.accounts.owner.key();
        profile.authority = ctx.accounts.authority.key();
        profile.username = username;
        profile.bio = bio;
        profile.avatar_url = avatar_url;
        profile.created_at = now;
        profile.updated_at = now;
        profile.update_count = 0;
        profile.bump = ctx.bumps.profile;

        emit!(ProfileCreated {
            owner: profile.owner,
            profile: profile.key(),
            username: profile.username.clone(),
        });
        msg!("Profile created: {} -> {}", profile.owner, profile.key());
        Ok(())
    }

    /// Partially updates a profile. Only the stored `authority` may sign.
    pub fn update_profile(
        ctx: Context<UpdateProfile>,
        username: Option<String>,
        bio: Option<String>,
        avatar_url: Option<String>,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile;

        let new_username = username.unwrap_or_else(|| profile.username.clone());
        let new_bio = bio.unwrap_or_else(|| profile.bio.clone());
        let new_url = avatar_url.unwrap_or_else(|| profile.avatar_url.clone());
        validate(&new_username, &new_bio, &new_url)?;

        profile.username = new_username;
        profile.bio = new_bio;
        profile.avatar_url = new_url;
        profile.updated_at = Clock::get()?.unix_timestamp;
        profile.update_count = profile.update_count.checked_add(1).ok_or(ProfileError::Overflow)?;

        msg!("Profile updated (#{}): {}", profile.update_count, profile.key());
        Ok(())
    }

    /// Closes the PDA and refunds rent to the authority.
    pub fn delete_profile(ctx: Context<DeleteProfile>) -> Result<()> {
        msg!("Profile deleted: {}", ctx.accounts.profile.key());
        Ok(())
    }
}

fn validate(username: &str, bio: &str, avatar_url: &str) -> Result<()> {
    require!(!username.trim().is_empty(), ProfileError::UsernameEmpty);
    require!(username.len() <= MAX_USERNAME_LEN, ProfileError::UsernameTooLong);
    require!(bio.len() <= MAX_BIO_LEN, ProfileError::BioTooLong);
    require!(avatar_url.len() <= MAX_URL_LEN, ProfileError::UrlTooLong);
    Ok(())
}

#[derive(Accounts)]
pub struct CreateProfile<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Profile::INIT_SPACE,
        seeds = [PROFILE_SEED, owner.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, Profile>,

    /// CHECK: wallet that the profile describes; used only as a PDA seed.
    pub owner: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProfile<'info> {
    #[account(
        mut,
        seeds = [PROFILE_SEED, profile.owner.as_ref()],
        bump = profile.bump,
        has_one = authority @ ProfileError::Unauthorized
    )]
    pub profile: Account<'info, Profile>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeleteProfile<'info> {
    #[account(
        mut,
        seeds = [PROFILE_SEED, profile.owner.as_ref()],
        bump = profile.bump,
        has_one = authority @ ProfileError::Unauthorized,
        close = authority
    )]
    pub profile: Account<'info, Profile>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Profile {
    pub owner: Pubkey,
    pub authority: Pubkey,
    #[max_len(32)]
    pub username: String,
    #[max_len(160)]
    pub bio: String,
    #[max_len(100)]
    pub avatar_url: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub update_count: u32,
    pub bump: u8,
}

#[event]
pub struct ProfileCreated {
    pub owner: Pubkey,
    pub profile: Pubkey,
    pub username: String,
}

#[error_code]
pub enum ProfileError {
    #[msg("Username cannot be empty")]
    UsernameEmpty,
    #[msg("Username is longer than 32 bytes")]
    UsernameTooLong,
    #[msg("Bio is longer than 160 bytes")]
    BioTooLong,
    #[msg("Avatar URL is longer than 100 bytes")]
    UrlTooLong,
    #[msg("Only the profile authority can modify it")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    Overflow,
}
