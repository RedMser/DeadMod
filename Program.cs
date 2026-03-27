using System;
using System.Collections.Generic;
using System.IO;
using System.Numerics;
using System.Runtime.InteropServices.JavaScript;

Console.WriteLine("SourceTwoUtils loaded.");

partial class SourceTwoUtils
{
    //[JSImport("dom.setInnerText", "main.js")]
    //internal static partial void SetInnerText(string selector, string content);

    [JSExport]
    internal static string[] ListFilePaths(byte[] dirVPK)
    {
        var vpkStream = new MemoryStream(dirVPK);
        var vpk = new SteamDatabase.ValvePak.Package();
        vpk.SetFileName("pak01_dir.vpk");
        vpk.Read(vpkStream);
        
        var paths = new List<string>();
        foreach (var group in vpk.Entries)
        {
            foreach (var entry in group.Value)
            {
                var filePath = entry.GetFullPath();
                // Only list supported file extensions
                if (filePath.EndsWith(".vtex_c", StringComparison.InvariantCultureIgnoreCase))
                {
                    paths.Add(filePath);
                }
            }
        }
        return paths.ToArray();
    }

    [JSExport]
    internal static byte[] MakeVPK(string[] filePaths, int[] fileSizes, byte[] fileContents, int[] textureSizes)
    {
        if (filePaths.Length != fileSizes.Length)
        {
            throw new ArgumentException("Mismatching filePaths and fileSizes array lengths.");
        }

        var fileContentsStream = new MemoryStream(fileContents);
        var vpkStream = new MemoryStream();
        var vpk = new SteamDatabase.ValvePak.Package();

        var textureSizesIndex = 0;

        for (var i = 0; i < filePaths.Length; i++)
        {
            var path = filePaths[i];
            var length = fileSizes[i];
            var bytes = new byte[length];
            fileContentsStream.ReadExactly(bytes, 0, length);

            // Make the file
            {
                if (path.EndsWith(".vtex_c", StringComparison.InvariantCultureIgnoreCase))
                {
                    var vtex = new VTEX
                    {
                        width = (ushort)textureSizes[textureSizesIndex],
                        height = (ushort)textureSizes[textureSizesIndex + 1],
                        reflectivity = new Vector3(1f, 1f, 1f),
                        imageData = bytes
                    };
                    textureSizesIndex += 2;

                    var vtexStream = new MemoryStream();
                    vtex.Write(vtexStream);
                    vpk.AddFile(path, vtexStream.ToArray());
                }
                else
                {
                    throw new ArgumentException("Unexpected file extension for " + path);
                }
            }
        }

        vpk.Write(vpkStream, new WasmMD5Provider());

        return vpkStream.ToArray();
    }
}
