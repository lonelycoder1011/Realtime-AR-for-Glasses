import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Glasses, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-2 mb-6">
            <Glasses className="h-8 w-8 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Glasses AR Try-On
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Experience the future of online shopping. Try on glasses virtually using your camera with real-time AR technology.
          </p>
        </div>

        {/* Main CTA */}
        <div className="text-center mb-16">
          <Link href="/try-on">
            <Button 
              size="lg" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Camera className="mr-2 h-5 w-5" />
              Try Glasses Now
            </Button>
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            No app download required • Works in your browser
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Camera className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <CardTitle>Real-Time Camera</CardTitle>
              <CardDescription>
                Use your device camera to see how glasses look on your face instantly
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Sparkles className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <CardTitle>AI-Powered Fitting</CardTitle>
              <CardDescription>
                Advanced face detection ensures perfect positioning and realistic appearance
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Glasses className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <CardTitle>Extensive Collection</CardTitle>
              <CardDescription>
                Browse through hundreds of frames from top brands and find your perfect match
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How it works */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">1</span>
              </div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Allow Camera Access</h3>
              <p className="text-gray-600 dark:text-gray-300">Grant permission to use your camera for the AR experience</p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">2</span>
              </div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Choose Glasses</h3>
              <p className="text-gray-600 dark:text-gray-300">Browse our collection and select frames to try on</p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">3</span>
              </div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">See the Magic</h3>
              <p className="text-gray-600 dark:text-gray-300">Watch as glasses appear on your face in real-time</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
