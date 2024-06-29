# subtitle-spreadsheet

A web-based subtitle editor built using Google Apps Script and React that simplifies subtitle creation for amateurs.

![](https://im.dt.in.th/ipfs/bafybeibnluvrqs6kzotodhnlcckayz7uwqhny6nw3kfhn2u4qabvpr2mge/image.webp)

- **Integrated with Google Sheets:** Leverages the familiarity and collaboration features of Google Sheets.

- **Real-time Preview:** The sidebar displays a YouTube video embedded alongside your subtitles, allowing you to preview your work.

- **Event-based Editing:** Unlike professional subtitle editors where you have to time both the start and end of each subtitle, this editor only requires you to set the start time. The end time is automatically calculated based on the start time of the next subtitle, thus streamlining the workflow.

## How I use it

I use [whisper.cpp](https://github.com/ggerganov/whisper.cpp) to convert speech to text. Then I convert its output into TSV format and paste it into the spreadsheet. This gives me the initial draft of the subtitles.

Now, the subtitle is full of spelling mistakes and inconsistencies. With some prompting, I can use generative AI models to correct the text.

![](https://im.dt.in.th/ipfs/bafybeidj3lsh2h33sya3opocmuxc7nparw2v2hwin3y7f7tla6l3ma6cla/image.webp)

![](https://im.dt.in.th/ipfs/bafybeiapbwq5osc5kvjss4bxltdcwi7npgpv7q7l4ydtojaqmotstapub4/image.webp)
