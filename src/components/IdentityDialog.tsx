'use client';

import { useState } from 'react';
import { AVATARS } from '@/lib/avatars';

type Props = {
  initial?: { nickname: string; avatar: string; signature?: string };
  onConfirm: (nickname: string, avatar: string, signature: string) => void;
  onClose?: () => void;
};

export function IdentityDialog({ initial, onConfirm, onClose }: Props) {
  const [nickname, setNickname] = useState(initial?.nickname ?? '');
  const [avatar, setAvatar] = useState<string>(initial?.avatar ?? AVATARS[0]);
  const [signature, setSignature] = useState(initial?.signature ?? '');

  const canSubmit = nickname.trim().length > 0;
  const isEdit = Boolean(initial);

  const isEmojiAvatar = (AVATARS as readonly string[]).includes(avatar);
  const charAvatar = isEmojiAvatar ? '' : avatar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900">{isEdit ? '编辑我的信息' : '起个攀岩名 🧗'}</h2>
        {!isEdit && <p className="mt-1 text-sm text-gray-500">群友会看到这个名字和头像</p>}

        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="你的昵称"
          maxLength={20}
          className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-black"
        />

        <input
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="个性签名（选填，比如：V3 选手 / 只爬抱石）"
          maxLength={60}
          className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-black"
        />

        <p className="mt-4 text-sm text-gray-500">选个头像</p>
        <div className="mt-2 grid max-h-44 grid-cols-6 gap-2 overflow-y-auto pr-1">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAvatar(a)}
              className={`flex aspect-square items-center justify-center rounded-xl text-2xl transition ${
                avatar === a ? 'bg-sky-100 ring-2 ring-sky-400' : 'hover:bg-sky-50'
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-gray-500">或者用一个字：</span>
          <input
            value={charAvatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="畅"
            className="h-10 w-24 rounded-xl border border-gray-300 text-center text-lg font-bold text-gray-900 outline-none focus:border-sky-400"
          />
        </div>

        <div className="mt-6 flex gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-300 py-3 font-semibold text-gray-700"
            >
              取消
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              const finalAvatar = isEmojiAvatar
                ? avatar
                : Array.from(avatar.trim())[0] || AVATARS[0];
              onConfirm(nickname.trim(), finalAvatar, signature.trim());
            }}
            disabled={!canSubmit}
            className="flex-1 rounded-xl bg-gradient-to-br from-sky-400 to-sky-500 py-3 font-semibold text-white shadow-md shadow-sky-100 transition disabled:opacity-40"
          >
            {isEdit ? '保存' : '开始攀岩'}
          </button>
        </div>
      </div>
    </div>
  );
}
