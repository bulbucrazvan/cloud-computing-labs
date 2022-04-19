using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Newtonsoft.Json;
using System.Text;

namespace Tema4.Pages
{
    public class IndexModel : PageModel
    {
        private readonly ILogger<IndexModel> _logger;
        private static readonly string subscriptionKey = "57f4dc77a62e488f94f8d555d0e7e2ff";
        private static readonly string endpoint = "https://api.cognitive.microsofttranslator.com/";
        private static readonly string location = "westeurope";
        private static SpeechConfig speechConfig = SpeechConfig.FromSubscription("4a8cea96a0e344dc8791d0396177d27c", "germanywestcentral");
        public Result MyResult { get; set; }
        [BindProperty]
        public string From { get; set; } = "ro";
        [BindProperty]
        public string To { get; set; } = "de";
        [BindProperty]
        public string Input { get; set; } = " ";
        [BindProperty]
        public string Output { get; set; }

        public IndexModel(ILogger<IndexModel> logger)
        {
            _logger = logger;
        }

        public async Task<IActionResult> OnPost()
        {
            string route = "/translate?api-version=3.0&from=" + From
                                                                + "&to=" + To;
            string textToTranslate = Input;
            object[] body = new object[] { new { Text = textToTranslate } };
            var requestBody = JsonConvert.SerializeObject(body);

            using (var client = new HttpClient())
            using (var request = new HttpRequestMessage())
            {
                request.Method = HttpMethod.Post;
                request.RequestUri = new Uri(endpoint + route);
                request.Content = new StringContent(requestBody, Encoding.UTF8, "application/json");
                request.Headers.Add("Ocp-Apim-Subscription-Key", subscriptionKey);
                request.Headers.Add("Ocp-Apim-Subscription-Region", location);

                HttpResponseMessage response = await client.SendAsync(request).ConfigureAwait(false);
                string result = await response.Content.ReadAsStringAsync();
                try
                {
                    var jsonResult = JsonConvert.DeserializeObject<List<Result>>(result);

                    MyResult = JsonConvert.DeserializeObject<List<Result>>(result)[0];
                    Output = MyResult.translations[0].Text;
                }
                catch (Exception ex) { }
                
                return Page();
            }
        }
        async Task SynthesizeToSpeaker(string text, string to)
        {
            Console.WriteLine(text);
            if (text != null)
            {
                Console.WriteLine(text);
            }
            else
            {
                Console.WriteLine("null");
            }
            var config = SpeechConfig.FromSubscription("4a8cea96a0e344dc8791d0396177d27c", "germanywestcentral");
            config.SpeechSynthesisLanguage = to + "-" + to.ToUpper();
            var synthesizer = new SpeechSynthesizer(config);
            await synthesizer.SpeakTextAsync(text);
        }

        async Task<string> RecognizeFromMic(SpeechConfig speechConfig)
        {
            var audioConfig = AudioConfig.FromDefaultMicrophoneInput();
            speechConfig.SpeechRecognitionLanguage = From + "-" + From.ToUpper();
            var recognizer = new SpeechRecognizer(speechConfig, audioConfig);
            var result = await recognizer.RecognizeOnceAsync();
            return result.Text;
        }

        public async Task<PageResult> OnGetListen(string Input, string Output, string From, string To)
        {
            this.From = From;
            this.To = To;
            this.Input = Input;
            this.Output = Output;
            var text = await RecognizeFromMic(speechConfig);
            this.Input = text;
            return Page();
        }

        public async Task<PageResult> OnGetSpeak(string Output, string Input, string From, string To)
        {
            this.From = From;
            this.To = To;
            this.Output = Output;
            this.Input = Input;
            await SynthesizeToSpeaker(Output, To);
            return Page();
        }
    }

    public class Result
    {
        public class Translated
        {
            public string Text { get; set; }
            public string To { get; set; }
        }
        public List<Translated> translations{ get; set; }

        
    }
}