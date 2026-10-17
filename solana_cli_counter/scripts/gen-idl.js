// Generates target/idl/counter.json (Anchor 0.30 IDL spec) without `anchor idl build`.
// Discriminators: sha256("global:<ix>")[0..8], sha256("account:<Name>")[0..8].
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const libRs = fs.readFileSync(path.join(root, 'programs/counter/src/lib.rs'), 'utf8');
const address = libRs.match(/declare_id!\("(\w+)"\)/)[1];

const disc = (s) => [...crypto.createHash('sha256').update(s).digest().subarray(0, 8)];

const idl = {
  address,
  metadata: { name: 'counter', version: '0.1.0', spec: '0.1.0', description: 'Created with Anchor' },
  instructions: [
    {
      name: 'initialize',
      discriminator: disc('global:initialize'),
      accounts: [
        { name: 'counter', writable: true, signer: true },
        { name: 'user', writable: true, signer: true },
        { name: 'system_program', address: '11111111111111111111111111111111' },
      ],
      args: [],
    },
    {
      name: 'increment',
      discriminator: disc('global:increment'),
      accounts: [{ name: 'counter', writable: true }],
      args: [],
    },
    {
      name: 'decrement',
      discriminator: disc('global:decrement'),
      accounts: [{ name: 'counter', writable: true }],
      args: [],
    },
  ],
  accounts: [{ name: 'Counter', discriminator: disc('account:Counter') }],
  errors: [{ code: 6000, name: 'CounterUnderflow', msg: 'Counter cannot go below 0' }],
  types: [
    {
      name: 'Counter',
      type: { kind: 'struct', fields: [{ name: 'count', type: 'u64' }] },
    },
  ],
};

const out = path.join(root, 'target/idl/counter.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(idl, null, 2));
console.log('IDL written to', out, '| program id:', address);
