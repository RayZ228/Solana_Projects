// Generates target/idl/sol_profile.json
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const libRs = fs.readFileSync(path.join(root, 'programs/sol_profile/src/lib.rs'), 'utf8');
const address = libRs.match(/declare_id!\("(\w+)"\)/)[1];

const disc = (s) => [...crypto.createHash('sha256').update(s).digest().subarray(0, 8)];

const idl = {
  address,
  metadata: { name: 'sol_profile', version: '0.1.0', spec: '0.1.0' },
  instructions: [
    {
      name: 'create_profile',
      discriminator: disc('global:create_profile'),
      accounts: [
        { name: 'profile', writable: true, pda: { seeds: [{ kind: 'const', value: [112, 114, 111, 102, 105, 108, 101] }, { kind: 'account', path: 'owner' }] } },
        { name: 'owner' },
        { name: 'authority', writable: true, signer: true },
        { name: 'system_program', address: '11111111111111111111111111111111' },
      ],
      args: [
        { name: 'username', type: 'string' },
        { name: 'bio', type: 'string' },
        { name: 'avatar_url', type: 'string' }
      ]
    },
    {
      name: 'update_profile',
      discriminator: disc('global:update_profile'),
      accounts: [
        { name: 'profile', writable: true },
        { name: 'authority', signer: true },
      ],
      args: [
        { name: 'username', type: { option: 'string' } },
        { name: 'bio', type: { option: 'string' } },
        { name: 'avatar_url', type: { option: 'string' } }
      ]
    },
    {
      name: 'delete_profile',
      discriminator: disc('global:delete_profile'),
      accounts: [
        { name: 'profile', writable: true },
        { name: 'authority', writable: true, signer: true },
      ],
      args: []
    }
  ],
  accounts: [{ name: 'Profile', discriminator: disc('account:Profile') }],
  errors: [
    { code: 6000, name: 'UsernameEmpty', msg: 'Username cannot be empty' },
    { code: 6001, name: 'UsernameTooLong', msg: 'Username is longer than 32 bytes' },
    { code: 6002, name: 'BioTooLong', msg: 'Bio is longer than 160 bytes' },
    { code: 6003, name: 'UrlTooLong', msg: 'Avatar URL is longer than 100 bytes' },
    { code: 6004, name: 'Unauthorized', msg: 'Only the profile authority can modify it' },
    { code: 6005, name: 'Overflow', msg: 'Arithmetic overflow' }
  ],
  types: [
    {
      name: 'Profile',
      type: {
        kind: 'struct',
        fields: [
          { name: 'owner', type: 'pubkey' },
          { name: 'authority', type: 'pubkey' },
          { name: 'username', type: 'string' },
          { name: 'bio', type: 'string' },
          { name: 'avatar_url', type: 'string' },
          { name: 'created_at', type: 'i64' },
          { name: 'updated_at', type: 'i64' },
          { name: 'update_count', type: 'u32' },
          { name: 'bump', type: 'u8' }
        ]
      }
    }
  ],
};

const out = path.join(root, 'target/idl/sol_profile.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(idl, null, 2));
console.log('IDL written to', out);
