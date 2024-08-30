import Base from '../assets/icons/base.png';
import Celo from '../assets/icons/celo.jpg';
import ETH from '../assets/icons/eth.svg';
import Gnosis from '../assets/icons/gno.svg';
import Matic from '../assets/icons/matic.svg';
import USDT from '../assets/icons/usdt.svg';


export const badgeIcons = [
    { ids: ['84532', '8453'], img: Base },
    { ids: ['11155111', '5', '1'], img: ETH },
    { ids: ['100'], img: 'https://app.safe.global/images/networks/gno.png' },
    { ids: ['42220'], img: Celo },
    { ids: ['1101', '137', '80001'], img: Matic },
    // Add more mappings as needed
  ];


export function getIconForId(id: any) {
    for (const icon of badgeIcons) {
      if (icon.ids.includes(id.toString())) {
        return icon.img;
      }
    }
      // Return a default icon or handle the case when no mapping is found
  return 'defaultIcon';
}


export const tokenList: any = {

  8453: [
    {
        value: '0x0000000000000000000000000000000000000000',
        label: 'ETH',
        image: ETH,
        description: 'Ether currency',
      },   
      {
        value: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        label: 'USDC',
        image: 
         'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/usdc.svg',
        description: 'USDC stablecoin',
      },                                                                                                    
                                                                                                 

  ],
  100: [
    {
        value: '0x0000000000000000000000000000000000000000',
        label: 'XDAI',
        image: "https://app.safe.global/images/networks/gno.png",
        description: 'XDAI currency',
      },    
      // {
      //   value: '0xef4229c8c3250C675F21BCefa42f58EfbfF6002a',
      //   label: 'USDC',
      //   image: 
      //    'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/usdc.svg',
      //   description: 'USDC stablecoin',
      // },                                                                                                   

  ],
  42220: [
    {
        value: '0x0000000000000000000000000000000000000000',
        label: 'CELO',
        image: Celo,
        description: 'Ether currency',
      },    
      {
        value: '0xef4229c8c3250C675F21BCefa42f58EfbfF6002a',
        label: 'USDC',
        image: 
         'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/usdc.svg',
        description: 'USDC stablecoin',
      },                                                                                                   

  ],
  137: [
    {
        value: '0x0000000000000000000000000000000000000000',
        label: 'MATIC',
        image: Matic,
        description: 'Ether currency',
      },   
    {
      value: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
      label: 'USDC',
      image:
        'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/usdc.svg',
      description: 'USDC stablecoin',
    },
    {
      value: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      label: 'USDT',
      image: USDT,
      description: 'USDT stablecoin',
    },                                                                                                 

  ],
  
  11155111: [
    {
        value: '0x0000000000000000000000000000000000000000',
        label: 'ETH',
        image: ETH,
        description: 'Ether currency',
      },                                                                                                    

  ],
  84532: [
    {
        value: '0x0000000000000000000000000000000000000000',
        label: 'ETH',
        image: ETH,
        description: 'Ether currency',
      },    
      
      {
        value: '0xC432004323f06ca58362A5EFd993A368c93d032b',
        label: 'OST',
        image: Base,
        description: 'Onchain Summer Token',
      },     

  ],


}


export  const getTokenInfo = (chainId: number, token: string) => 

{
    try{ 
    if(Object.keys(tokenList).includes(chainId.toString())) {

        return tokenList[chainId].find((item: any) => item.value.toLowerCase() == token?.toLowerCase());

    }
   }
   catch(e) {
       console.log('Error getting token info')
   }
    
    return {};
}

export  const getTokenList = (chainId: number) => 

{
    if(Object.keys(tokenList).includes(chainId.toString())) {

        return tokenList[chainId];

    }
   
    return [];
}