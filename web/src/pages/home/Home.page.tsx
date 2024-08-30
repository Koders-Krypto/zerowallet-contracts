import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Group,
  Input,
  Paper,
  useMantineColorScheme,
  Anchor,
  Alert,
  TextInput,
} from '@mantine/core';
import classes from './Home.module.css';
import Safe from '../../assets/images/safe.svg';

import { NetworkUtil } from '../../logic/networks';
import { useDisclosure } from '@mantine/hooks';
import {  addValidatorModule } from '../../logic/module';

import { IconBrandGithub} from '@tabler/icons';


import { useNavigate } from 'react-router-dom';
import { getProvider } from '@/logic/web3';
import {tokenList } from '@/logic/tokens';


import { IconBrandX } from '@tabler/icons-react';
import { RoutePath } from '@/navigation/route-path';
import { Hex } from 'viem';
import useLinkStore from '@/store/link/link.store';



function HomePage() {

  const navigate = useNavigate();
  
  const { colorScheme } = useMantineColorScheme();

  const dark = colorScheme === 'dark';

  const { chainId, setChainId } = useLinkStore((state: any) => state);


  const [ownerAddress, setOwnerAddress] = useState<string>("");
  const [network, setNetwork] = useState('');

  const [ownerAdded, setOwnerAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [safeError, setSafeError] = useState(false);





  const create = async () => {
    setIsLoading(true);
    try {
     await addValidatorModule(
        ownerAddress as Hex
      );
      setIsLoading(false);
    } catch (e) { 
      console.log(e)
      setIsLoading(false);
      setSafeError(true);
    }
    setOwnerAdded(true);
  };


 
  useEffect(() => {
    (async () => {
      const provider = await getProvider();

      const chainId = (await provider.getNetwork()).chainId;

      setChainId(Number(chainId));
      setNetwork(
        `${NetworkUtil.getNetworkById(Number(chainId))?.name}`
      );


        
    })();
  }, []);

  return (
    <>
            <div>      
            <h1 className={classes.heading}>External validator for your
            <div className={classes.safeContainer}>
            <img
            className={classes.safe}
            src={Safe}
            alt="avatar"
            />
            </div>
            </h1>
            </div>
      { ownerAdded && !safeError ? (
        <>
          <div className={classes.successContainer}>
            <Paper className={classes.formContainer} shadow="md" withBorder radius="md" >
              <h1 className={classes.heading}>You are all set!</h1>

              <p className={classes.subheading} style={{ textAlign: 'center' }}>
                
              Check out the magic of Safe validator <Anchor target='_blank' href={"#" + RoutePath.account} >here </Anchor> ❤️ ❤️
              </p>
              <div className={classes.actions}>
            <Button size="lg" radius="md"
              onClick={() => setOwnerAdded(false)}
             style={{ width: '180px' }}        
                color={ dark ? "#49494f" : "#c3c3c3" } 
                variant={ "filled" } 
               >Home</Button>
          </div>
            </Paper>
          </div>
        </>
      ) : (
        <>
        

        
        <div className={classes.homeContainer}>

        <Paper className={classes.formContainer} shadow="md" withBorder radius="md" p="xl" >

        { !Object.keys(tokenList).includes(chainId.toString()) && <Alert variant="light" color="yellow" radius="lg" title="Unsupported Network">
      SafeValidator supports only these networks as of now <b> : <br/> {Object.keys(tokenList).map((chainId) => `${NetworkUtil.getNetworkById(Number(chainId))?.name} ${NetworkUtil.getNetworkById(Number(chainId))?.type}, `)} </b>
    </Alert> }

    { safeError && <Alert variant="light" color="yellow" radius="lg" title="Open as Safe App">

     Try this application as a <span/>
      <Anchor href="https://app.safe.global/share/safe-app?appUrl=https://7579-validator.zenguard.xyz&chain=sep">
      Safe App
        </Anchor> <span/>
        on Safe Wallet.
      
    </Alert> }
          
          
          
          {/* <div className={classes.formContainer}> */}
            
            <div className={classes.inputContainer}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '20px',
                  marginBottom: '20px',
                  alignItems: 'center',
                }}
              >

              </div>

              <Input.Wrapper label={`Enter a new owner address for your Safe `}>
                <TextInput
                  type="string"
                  size="lg"
                  value={ownerAddress}
                  onChange={(e) => setOwnerAddress(e?.target?.value)}
                  placeholder="Enter Address"
                  // className={classes.input}
                  description={`The address of the new owner for the Safe.`}
                  inputWrapperOrder={['label', 'input', 'description']}
                />
              </Input.Wrapper>
            </div>
            
            <Button
              size="lg" radius="md" 
              fullWidth
              color="green"
              className={classes.btn}
              onClick={create}
              loaderProps={{ color: 'white', type: 'dots', size: 'md' }}
              loading={isLoading}
            >
              {isLoading ? 'Adding Owner ...' : 'Add Owner'}
            </Button>
            <br/>

            <p className={classes.subHeading}>
              Just enter the new owner address for your Safe ✨
            </p>
          </Paper>
          
        </div>

     
        </>
      )}
             
             <div className={classes.avatarContainer}>

            <Group className={classes.mode}>
            {/* <Group className={classes.container} position="center"> */}
            <IconBrandX 
            size={30}
            stroke={1.5}
            onClick={() => window.open("https://x.com/zenguardxyz")}
            style={{ cursor: 'pointer' }}
            />
            <IconBrandGithub
            size={30}
            stroke={1.5}
            onClick={() => window.open("https://github.com/koshikraj/safe-7579-demo")}
            style={{ cursor: 'pointer' }}
            />

            {/* </Group> */}
            {/* </Group> */}
            </Group>
            </div>
    </>
  );
}

export default HomePage;

// show dropdown. no model. list all token
