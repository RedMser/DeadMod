using System;
using SteamDatabase.ValvePak;

public sealed class WasmMD5Provider : IMD5Provider
{
    public byte[] HashData(byte[] source)
    {
        var hasher = new WasmMD5Hasher();
        hasher.TransformFinalBlock(source, 0, source.Length);
        return hasher.Hash!;
    }

    public IMD5Hasher Create() => new WasmMD5Hasher();
}

public sealed class WasmMD5Hasher : IMD5Hasher
{
    private readonly MD5Core _core = new MD5Core();
    private bool _finalized;

    public byte[]? Hash { get; private set; }

    public int TransformBlock(byte[] inputBuffer, int inputOffset, int inputCount, byte[]? outputBuffer, int outputOffset)
    {
        if (_finalized) throw new InvalidOperationException("Already finalized");

        _core.Update(inputBuffer, inputOffset, inputCount);

        if (outputBuffer != null)
        {
            Buffer.BlockCopy(inputBuffer, inputOffset, outputBuffer, outputOffset, inputCount);
        }

        return inputCount;
    }

    public byte[] TransformFinalBlock(byte[] inputBuffer, int inputOffset, int inputCount)
    {
        if (_finalized) throw new InvalidOperationException("Already finalized");

        _core.Update(inputBuffer, inputOffset, inputCount);
        Hash = _core.Final();
        _finalized = true;

        var result = new byte[inputCount];
        Buffer.BlockCopy(inputBuffer, inputOffset, result, 0, inputCount);
        return result;
    }
}

internal sealed class MD5Core
{
    private uint A = 0x67452301;
    private uint B = 0xefcdab89;
    private uint C = 0x98badcfe;
    private uint D = 0x10325476;

    private ulong count;
    private readonly byte[] buffer = new byte[64];

    public void Update(byte[] input, int offset, int length)
    {
        int bufferIndex = (int)(count % 64);
        count += (ulong)length;

        int partLen = 64 - bufferIndex;
        int i = 0;

        if (length >= partLen)
        {
            Buffer.BlockCopy(input, offset, buffer, bufferIndex, partLen);
            Transform(buffer, 0);

            for (i = partLen; i + 63 < length; i += 64)
            {
                Transform(input, offset + i);
            }

            bufferIndex = 0;
        }

        Buffer.BlockCopy(input, offset + i, buffer, bufferIndex, length - i);
    }

    public byte[] Final()
    {
        byte[] padding = new byte[64];
        padding[0] = 0x80;

        byte[] lengthBytes = BitConverter.GetBytes(count * 8);

        int padLen = (int)((count % 64) < 56 ? (56 - count % 64) : (120 - count % 64));

        Update(padding, 0, padLen);
        Update(lengthBytes, 0, 8);

        byte[] result = new byte[16];
        WriteUInt(result, 0, A);
        WriteUInt(result, 4, B);
        WriteUInt(result, 8, C);
        WriteUInt(result, 12, D);

        return result;
    }

    private void Transform(byte[] block, int offset)
    {
        uint a = A, b = B, c = C, d = D;
        uint[] x = new uint[16];

        for (int i = 0; i < 16; i++)
        {
            x[i] = BitConverter.ToUInt32(block, offset + i * 4);
        }

        // Round 1
        FF(ref a, b, c, d, x[0], 7, 0xd76aa478);
        FF(ref d, a, b, c, x[1], 12, 0xe8c7b756);
        FF(ref c, d, a, b, x[2], 17, 0x242070db);
        FF(ref b, c, d, a, x[3], 22, 0xc1bdceee);
        FF(ref a, b, c, d, x[4], 7, 0xf57c0faf);
        FF(ref d, a, b, c, x[5], 12, 0x4787c62a);
        FF(ref c, d, a, b, x[6], 17, 0xa8304613);
        FF(ref b, c, d, a, x[7], 22, 0xfd469501);
        FF(ref a, b, c, d, x[8], 7, 0x698098d8);
        FF(ref d, a, b, c, x[9], 12, 0x8b44f7af);
        FF(ref c, d, a, b, x[10], 17, 0xffff5bb1);
        FF(ref b, c, d, a, x[11], 22, 0x895cd7be);
        FF(ref a, b, c, d, x[12], 7, 0x6b901122);
        FF(ref d, a, b, c, x[13], 12, 0xfd987193);
        FF(ref c, d, a, b, x[14], 17, 0xa679438e);
        FF(ref b, c, d, a, x[15], 22, 0x49b40821);

        // Round 2
        GG(ref a, b, c, d, x[1], 5, 0xf61e2562);
        GG(ref d, a, b, c, x[6], 9, 0xc040b340);
        GG(ref c, d, a, b, x[11], 14, 0x265e5a51);
        GG(ref b, c, d, a, x[0], 20, 0xe9b6c7aa);
        GG(ref a, b, c, d, x[5], 5, 0xd62f105d);
        GG(ref d, a, b, c, x[10], 9, 0x02441453);
        GG(ref c, d, a, b, x[15], 14, 0xd8a1e681);
        GG(ref b, c, d, a, x[4], 20, 0xe7d3fbc8);
        GG(ref a, b, c, d, x[9], 5, 0x21e1cde6);
        GG(ref d, a, b, c, x[14], 9, 0xc33707d6);
        GG(ref c, d, a, b, x[3], 14, 0xf4d50d87);
        GG(ref b, c, d, a, x[8], 20, 0x455a14ed);
        GG(ref a, b, c, d, x[13], 5, 0xa9e3e905);
        GG(ref d, a, b, c, x[2], 9, 0xfcefa3f8);
        GG(ref c, d, a, b, x[7], 14, 0x676f02d9);
        GG(ref b, c, d, a, x[12], 20, 0x8d2a4c8a);

        // Round 3
        HH(ref a, b, c, d, x[5], 4, 0xfffa3942);
        HH(ref d, a, b, c, x[8], 11, 0x8771f681);
        HH(ref c, d, a, b, x[11], 16, 0x6d9d6122);
        HH(ref b, c, d, a, x[14], 23, 0xfde5380c);
        HH(ref a, b, c, d, x[1], 4, 0xa4beea44);
        HH(ref d, a, b, c, x[4], 11, 0x4bdecfa9);
        HH(ref c, d, a, b, x[7], 16, 0xf6bb4b60);
        HH(ref b, c, d, a, x[10], 23, 0xbebfbc70);
        HH(ref a, b, c, d, x[13], 4, 0x289b7ec6);
        HH(ref d, a, b, c, x[0], 11, 0xeaa127fa);
        HH(ref c, d, a, b, x[3], 16, 0xd4ef3085);
        HH(ref b, c, d, a, x[6], 23, 0x04881d05);
        HH(ref a, b, c, d, x[9], 4, 0xd9d4d039);
        HH(ref d, a, b, c, x[12], 11, 0xe6db99e5);
        HH(ref c, d, a, b, x[15], 16, 0x1fa27cf8);
        HH(ref b, c, d, a, x[2], 23, 0xc4ac5665);

        // Round 4
        II(ref a, b, c, d, x[0], 6, 0xf4292244);
        II(ref d, a, b, c, x[7], 10, 0x432aff97);
        II(ref c, d, a, b, x[14], 15, 0xab9423a7);
        II(ref b, c, d, a, x[5], 21, 0xfc93a039);
        II(ref a, b, c, d, x[12], 6, 0x655b59c3);
        II(ref d, a, b, c, x[3], 10, 0x8f0ccc92);
        II(ref c, d, a, b, x[10], 15, 0xffeff47d);
        II(ref b, c, d, a, x[1], 21, 0x85845dd1);
        II(ref a, b, c, d, x[8], 6, 0x6fa87e4f);
        II(ref d, a, b, c, x[15], 10, 0xfe2ce6e0);
        II(ref c, d, a, b, x[6], 15, 0xa3014314);
        II(ref b, c, d, a, x[13], 21, 0x4e0811a1);
        II(ref a, b, c, d, x[4], 6, 0xf7537e82);
        II(ref d, a, b, c, x[11], 10, 0xbd3af235);
        II(ref c, d, a, b, x[2], 15, 0x2ad7d2bb);
        II(ref b, c, d, a, x[9], 21, 0xeb86d391);

        A += a;
        B += b;
        C += c;
        D += d;
    }

    private static uint F(uint x, uint y, uint z) => (x & y) | (~x & z);
    private static uint G(uint x, uint y, uint z) => (x & z) | (y & ~z);
    private static uint H(uint x, uint y, uint z) => x ^ y ^ z;
    private static uint I(uint x, uint y, uint z) => y ^ (x | ~z);

    private static uint RotateLeft(uint x, int n) => (x << n) | (x >> (32 - n));

    private static void FF(ref uint a, uint b, uint c, uint d, uint x, int s, uint ac)
    {
        a = b + RotateLeft(a + F(b, c, d) + x + ac, s);
    }

    private static void GG(ref uint a, uint b, uint c, uint d, uint x, int s, uint ac)
    {
        a = b + RotateLeft(a + G(b, c, d) + x + ac, s);
    }

    private static void HH(ref uint a, uint b, uint c, uint d, uint x, int s, uint ac)
    {
        a = b + RotateLeft(a + H(b, c, d) + x + ac, s);
    }

    private static void II(ref uint a, uint b, uint c, uint d, uint x, int s, uint ac)
    {
        a = b + RotateLeft(a + I(b, c, d) + x + ac, s);
    }

    private static void WriteUInt(byte[] buffer, int offset, uint value)
    {
        buffer[offset] = (byte)(value & 0xff);
        buffer[offset + 1] = (byte)((value >> 8) & 0xff);
        buffer[offset + 2] = (byte)((value >> 16) & 0xff);
        buffer[offset + 3] = (byte)((value >> 24) & 0xff);
    }
}
