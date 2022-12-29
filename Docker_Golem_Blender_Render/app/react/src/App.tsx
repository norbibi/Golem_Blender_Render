import React, { useState, useEffect } from 'react'
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Button from 'react-bootstrap/Button';
import Collapse from 'react-bootstrap/Collapse';
import JSZip from "jszip";
import $ from 'jquery';
import useScreenSize from 'use-screen-size'

import { useFormControl, useFormInputDirectory, useFormInputRange, useFormInputRangeValue, useFormSelect, useFormListSelect, useFormToggleButton } from "./useForm";
import { WsClient, Upload } from "./ComServer";

const wsclient = new WsClient('ws://' + window.location.hostname + ':8000');
const uploader = new Upload('http://' + window.location.hostname + ':3001/upload');

function App() {

  const size = useScreenSize();

  const AllCompatibleGpus = [ "None",
                              "GA102 [GeForce RTX 3090]"]

  const AllSubnets = [ "public",
                       "devnet-beta",
                       "public-beta"]

  const [ProjectReceived, SetProjectReceived] = useState(false);
  const [SceneAnalysed, SetSceneAnalysed] = useState(false);

  const [MinStartFrame, SetMinStartFrame] = useState(0);
  const [MaxEndFrame, SetMaxEndFrame] = useState(0);

  const [Uploading, SetUploading] = useState(false);
  const [Scanning, SetScanning] = useState(false);

  const [Running, SetRunning] = useState(false);
  const [AppMessages, SetAppMessages] = useState<string[]>([]);

  const [Subnet, FormSubnet] = useFormListSelect("Subnet", AllSubnets, 0);
  const [Budget, FormBudget] = useFormControl("number", "Budget", "10");
  const [Workers, FormWorkers] = useFormControl("number", "Workers", "15");
  const [BlenderProject, FormBlenderProject] = useFormInputDirectory("Blender project folder", sendProject);
  const [Frames, FormFrames] = useFormInputRange("Frames", MinStartFrame, MaxEndFrame);
  const [BlenderFile, FormBlenderFile] = useFormSelect("Blender file", BlenderProject, analyseScene);
  const [Gpu, FormGpu] = useFormListSelect("Gpu", AllCompatibleGpus, 0);

  const [PMemory, FormPMemory] = useFormControl("number", "Memory (Gb)", "8");
  const [PStorage, FormPStorage] = useFormControl("number", "Storage (Gb)", "8");
  const [PThreads, FormPThreads] = useFormControl("number", "Threads", "15");

  const [TimeoutGlobal, FormTimeoutGlobal] = useFormInputRangeValue("Global (h)", 1, 800, 4);
  const [TimeoutUpload, FormTimeoutUpload] = useFormInputRangeValue("Upload (mn)", 1, 60, 10);
  const [TimeoutRender, FormTimeoutRender] = useFormInputRangeValue("Render (mn)", 1, 60, 10);

  const [IPayment, FormIPayment] = useFormInputRangeValue("Payment interval (s)", 0, 3600, 300);
  const [StartPrice, FormStartPrice] = useFormInputRangeValue("Start Price (mGLM)", 0, 5000, 0);
  const [CpuPrice, FormCpuPrice] = useFormInputRangeValue("CPU price (mGLM/h)", 0, 5000, 100);
  const [EnvPrice, FormEnvPrice] = useFormInputRangeValue("Env price (mGLM/h)", 0, 5000, 100);

  const [Counter, SetCounter] = useState(0);
  const [Progression, SetProgression] = useState(0);

  const [CollapseProviders, SetCollapseProviders] = useState(false);
  const [CollapsePrices, SetCollapsePrices] = useState(false);
  const [CollapseTimeouts, SetCollapseTimeouts] = useState(false);
  const [CollapseProject, SetCollapseProject] = useState(false);

  const [IPaymentEnable, SetIPaymentEnable] = useState(false);

  function CbUpload(item: any) {
    switch(item.file.name) {
        case 'scene.blend':
            wsclient.SendMessage({
              command: "analyseScene"
            });
            break;

      case 'archive.zip':
        SetProjectReceived(true);
        SetUploading(false);
        break;

      default:
    }
  }

  function CbSceneAnalysed(message: any) {
    try {
      var jsonmsg = JSON.parse(message.data.trim().replace(/'/g, '"') as string);
      SetMinStartFrame(jsonmsg.start);
      SetMaxEndFrame(jsonmsg.end);
      SetScanning(false);
      SetSceneAnalysed(true);
    }
    catch {}
  }

  function CbAppMessage(message: any, cbdata: any) {
    if (message.finished)
    {
      clearInterval(cbdata);
      SetRunning(false);
    }
    else if (message.count)
      SetCounter(Counter + 1);
    else if (message.result)
      SetAppMessages([message.result, ...AppMessages.slice(0, 99)]);
  }

  const MessageListeners = {
    'analyseScene': CbSceneAnalysed,
    'App': CbAppMessage
  }

  uploader.SetCb(CbUpload);
  wsclient.SetListener(MessageListeners);

  function sendProject() {

    SetSceneAnalysed(false);
    SetProjectReceived(false);
    SetUploading(true);

    const zip = new JSZip();
    (BlenderProject as File[]).forEach((file) => {
      zip.file(file.webkitRelativePath, file);
    });
    zip
      .generateAsync({ type: "blob" })
      .then(function (content) {
        var file = new File([content], "archive.zip");
        uploader.AddFile(file);
      })
      .catch((e) => console.log(e));
  }

  function analyseScene() {
    SetScanning(true);
    var newfile = new File([BlenderFile], "scene.blend");
    uploader.AddFile(newfile);
  }

  function Providers() {
    SetCollapseProviders(!CollapseProviders);
  }

  function Timeouts() {
   SetCollapseTimeouts(!CollapseTimeouts);
  }

  function Prices() {
    SetCollapsePrices(!CollapsePrices)
  }

  function Project() {
    SetCollapseProject(!CollapseProject);
  }

  function run() {
    SetRunning(true);
    SetAppMessages([]);
    SetCounter(0);
    SetProgression(0);

    var network = 'rinkeby';
    var subnet = AllSubnets[Subnet];
    if (subnet === 'public-beta')
      network = 'polygon';

    wsclient.SendMessage({
      command: "startApp",
      driver: 'erc20',
      network: network,
      subnet: subnet,
      timeoutUpload: TimeoutUpload,
      timeoutRender: TimeoutRender,
      timeoutGlobal: TimeoutGlobal,
      workers: Workers,
      memory: PMemory,
      storage: PStorage,
      threads: PThreads,
      gpu: AllCompatibleGpus[Gpu],
      budget: Budget,
      iPayment: IPayment,
      startPrice: StartPrice,
      cpuPrice: CpuPrice,
      envPrice: EnvPrice,
      startFrame: (Frames as { min: any; max: any; }).min,
      endFrame: (Frames as { min: any; max: any; }).max,
      scene: BlenderFile.webkitRelativePath
    });

    var timeout = setInterval(function() {
      wsclient.SendMessage({
        command: "rearmTimeout"
      });
    }, 3000);

    wsclient.SetCbdata(timeout);
  }

  function resize_app() {

    var cllattrstyle;
    var clrattrstyle;

    if (['xs', 's', 'm'].indexOf(size.screen) !== -1)
    {
      cllattrstyle = '';
      clrattrstyle = 'padding-top: 12px !important; padding-bottom: 12px !important;';

    }
    else
    {
      cllattrstyle = 'padding-right: 6px !important;';
      clrattrstyle = 'padding-left: 6px !important;';
    }

    var title_height = ($('#title') as any).height();
    var app_height = window.innerHeight - title_height - 12;
    var top_height = $('#top').height()

    if (top_height !== undefined)
    {
      if (window.innerHeight > top_height)
      {
        $('.app').attr('style', 'height:'+app_height+'px !important;');
        $('#cll').attr('style', 'height:'+app_height+'px !important;' + cllattrstyle);
        $('#clr').attr('style', 'height:'+app_height+'px !important;' + clrattrstyle);
      }
      else
      {
        $('.app').attr('style', 'height:'+app_height+'; margin-bottom:6px !important;');
        $('#cll').attr('style', 'height:'+app_height+'; margin-bottom:6px !important;' + cllattrstyle);
        $('#clr').attr('style', 'height:'+app_height+'; margin-bottom:6px !important;' + clrattrstyle);
      }
    }
  }

  useEffect(() => {
    SetProgression(Number((Counter*100/((Frames as { min: any; max: any; }).max-(Frames as { min: any; max: any; }).min+1)).toFixed(0)));
  }, [Counter]);

  useEffect(() => {
    resize_app();
  }, [size]);

  useEffect(() => {
    SetIPaymentEnable(TimeoutGlobal >= 5);
  }, [TimeoutGlobal]);

  return (
    <div className="h-100" id="top">
      <div id="title" className="d-flex align-items-center justify-content-center">
        <h1>Golem Blender Render</h1>
      </div>
      <Container fluid className="app">
        <Row>
        <Col id="cll" xs="12" sm="12" md="12" lg="6" xl="6" xxl="6" className="d-flex align-items-left justify-content-left">
          <div className="square bg-info rounded" style={{width: "100%", paddingLeft: "20px", paddingRight: "20px",  paddingTop: "20px", paddingBottom: "20px",
                                                          height: "100%", marginLeft: "0px", marginRight: "0px",  marginTop: "0px", marginBottom: "12px", overflowY: "scroll"}}>
            {FormSubnet}

            <span>
              <div className="d-grid gap-2">
                <Button onClick={Providers} style={{marginTop: "20px", marginBottom: "20px"}}>Providers</Button>
              </div>
              <Collapse in={CollapseProviders}>
                <div>
                  {FormPMemory}
                  {FormPStorage}
                  {FormPThreads}
                  {FormWorkers}
                  {FormGpu}
                </div>
              </Collapse>
            </span>

            <span>
              <div className="d-grid gap-2">
                <Button onClick={Prices} style={{marginTop: "20px", marginBottom: "20px"}}>Budget, Prices & Payment</Button>
              </div>
              <Collapse in={CollapsePrices}>
                <div>
                  {FormBudget}
                  { IPaymentEnable && (
                    <div>
                      {FormIPayment}
                    </div>
                  )}
                  { !IPaymentEnable && (
                    <div>
                      <Form.Group className="mb-3">
                        <Form.Label>Payment interval (s)</Form.Label>
                        <p>Global timeout must be greater than 5h to enable middle-agreement</p>
                      </Form.Group>
                    </div>
                  )}
                  {FormStartPrice}
                  {FormCpuPrice}
                  {FormEnvPrice}
                </div>
              </Collapse>
            </span>

            <span>
              <div className="d-grid gap-2">
                <Button onClick={Timeouts} style={{marginTop: "20px", marginBottom: "20px"}}>Timeouts</Button>
              </div>
              <Collapse in={CollapseTimeouts}>
                <div>
                  {FormTimeoutGlobal}
                  {FormTimeoutUpload}
                  {FormTimeoutRender}
                </div>
              </Collapse>
            </span>

            <span>
              <div className="d-grid gap-2">
                <Button onClick={Project} style={{marginTop: "20px", marginBottom: "20px"}}>Project</Button>
              </div>
              <Collapse in={CollapseProject}>
                <div>
                  {FormBlenderProject}

                  { Uploading && (
                    <Row style={{paddingTop: "20px"}}>
                      <Col>
                        <ProgressBar animated now={100} label={'Uploading'} />
                      </Col>
                    </Row>
                  )}

                  { ProjectReceived && (
                    FormBlenderFile
                  )}

                  { Scanning && (
                    <Row style={{paddingTop: "20px"}}>
                      <Col>
                        <ProgressBar animated now={100} label={'Analysing'} />
                      </Col>
                    </Row>
                  )}

                  { SceneAnalysed && (
                    FormFrames
                  )}
                </div>
              </Collapse>
            </span>

            { !Running && SceneAnalysed && (
              <Button onClick={run} style={{marginTop: "20px"}}>Run</Button>
            )}
            { Running && (
              <Row style={{paddingTop: "20px"}}>
                <Col>
                  Running
                  <ProgressBar animated now={Progression} label={`${Progression}%`} />
                </Col>
              </Row>
            )}
          </div>
        </Col>
        <Col id="clr" xs="12" sm="12" md="12" lg="6" xl="6" xxl="6" className="d-flex align-items-left justify-content-left">
          <div className="square bg-info rounded" style={{width: "100%", paddingLeft: "20px", paddingRight: "20px",  paddingTop: "20px",
            paddingBottom: "20px", marginLeft: "0px", marginRight: "0px",  marginTop: "0px", marginBottom: "0px", overflowY: "scroll"}}>

            {AppMessages.map((msg, index) => {
              return (<Alert key={index}>{msg}</Alert>)
            })}

          </div>
        </Col>
        </Row>
      </Container>
    </div>
  )
}

export default App;
