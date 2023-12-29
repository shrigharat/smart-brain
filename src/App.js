import React, { Component } from 'react';
// import Particles from 'react-particles-js';
import ParticlesBg from 'particles-bg'
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import Navigation from './components/Navigation/Navigation';
import Signin from './components/Signin/Signin';
import Register from './components/Register/Register';
import Logo from './components/Logo/Logo';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import Rank from './components/Rank/Rank';
import './App.css';
import { Toaster, toast } from 'react-hot-toast';

const initialState = {
  input: '',
  imageUrl: '',
  boxes: [],
  route: 'home',
  isSignedIn: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: ''
  }
}


class App extends Component {
  constructor() {
    super();
    this.state = initialState;
  }

  componentDidMount = async () => {
    const token = window.sessionStorage.getItem('token');
    if(token) {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_BASE_URL}/signin`, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          }
        });
        const data = await response.json();
        if(data.success) {
          //set user
          this.setState({isSignedIn: true});
          this.loadUser(data.userData);
          toast("Sign in successfull!");
        } else {
          this.setState({route: 'signin'});
        }
      } catch (error) {
        toast("Could not signin!");
        this.setState({route: 'signin'});
      }
    } else {
      this.setState({route: 'signin'});
    }
  }

  loadUser = (data) => {
    this.setState({user: {
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries,
      joined: data.joined
    }})
  }

  calculateFaceLocations = (data) => {
    console.log({data});
    if(!data || !data.outputs) return undefined;

    return data.outputs[0].data.regions.map(
      (face) => {
        const clarifaiFace = face.region_info.bounding_box;
        const image = document.getElementById('inputimage');
        const width = Number(image.width);
        const height = Number(image.height);
        return {
          leftCol: clarifaiFace.left_col * width,
          topRow: clarifaiFace.top_row * height,
          rightCol: width - (clarifaiFace.right_col * width),
          bottomRow: height - (clarifaiFace.bottom_row * height)
        }
      }
    );
  }

  displayFaceBoxes = (boxes) => {
    if(!boxes) return;

    this.setState({boxes: boxes});
  }

  onInputChange = (event) => {
    this.setState({input: event.target.value});
  }

  onButtonSubmit = () => {
    const token = window.sessionStorage.getItem('token');
    this.setState({imageUrl: this.state.input});
    fetch(`${process.env.REACT_APP_BACKEND_BASE_URL}/imageurl`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({
        input: this.state.input
      })
    })
    .then(response => response.json())
    .then(response => {
      if(response)
      if (response) {
        fetch(`${process.env.REACT_APP_BACKEND_BASE_URL}/image`, {
          method: 'put',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify({
            id: this.state.user.id
          })
        })
        .then(response => response.json())
        .then(data => {
          if(!data.success) return;
          this.setState(Object.assign(this.state.user, { entries: count}))
        })
        .catch(console.log)

      }
      this.displayFaceBoxes(this.calculateFaceLocations(response))
    })
    .catch(err => console.log(err));
  }

  onRouteChange = (route) => {
    if (route === 'signout') {
      if(this.state.isSignedIn) {
        const token = window.sessionStorage.getItem('token');
        fetch(`${process.env.REACT_APP_BACKEND_BASE_URL}/signout`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
          }
        }).then(() => {
          window.sessionStorage.removeItem('token');
          this.setState({isSignedIn: false})
        })
      }
    } else if (route === 'home') {
      this.setState({isSignedIn: true})
    }
    this.setState({route: route});
  }

  render() {
    const { isSignedIn, imageUrl, route, boxes } = this.state;
    return (
      <div className="App">
        <ParticlesBg type="circle" bg={true} />
        <div className='bluroverlay'>
        </div>
        <Toaster />
        <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange} />
        { route === 'home'
          ? <div>
              <Logo />
              <Rank
                name={this.state.user.name}
                entries={this.state.user.entries}
              />
              <ImageLinkForm
                onInputChange={this.onInputChange}
                onButtonSubmit={this.onButtonSubmit}
              />
              <FaceRecognition boxes={boxes} imageUrl={imageUrl} />
            </div>
          : (
              route === 'signin'
              ? <Signin loadUser={this.loadUser} onRouteChange={this.onRouteChange}/>
              : <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange}/>
            )
        }
      </div>
    );
  }
}

export default App;
