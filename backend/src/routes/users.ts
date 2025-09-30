import express, { Request, Response } from 'express';
import User from '../models/User';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all users (admin only, for now just authenticated)
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('businessId', 'name category')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      users,
      count: users.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .select('-password')
      .populate('businessId', 'name category logoUrl rating reviewCount');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get user profile by ID (public profile)
router.get('/profile/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .select('-password -emailVerifiedAt -passwordResetAt -phone')
      .populate('businessId', 'name category logoUrl');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Get user posts
router.get('/:id/posts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Mock posts data for now - would fetch from posts collection
    const mockPosts = [
      {
        id: 1,
        content: 'Właśnie wróciłem z niesamowitej wycieczki po Zakopanem! 🏔️',
        mediaUrl: 'https://picsum.photos/600/400?random=10',
        mediaType: 'photo',
        createdAt: new Date('2024-01-15'),
        likes: 24,
        comments: 8,
        shares: 3
      }
    ];

    res.json(mockPosts);
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

// Get user photos
router.get('/:id/photos', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Mock photos data for now
    const mockPhotos = Array.from({ length: 12 }, (_, i) => 
      `https://picsum.photos/400/400?random=${i + 20}`
    );

    res.json(mockPhotos);
  } catch (error) {
    console.error('Get user photos error:', error);
    res.status(500).json({ error: 'Failed to fetch user photos' });
  }
});

// Get user videos
router.get('/:id/videos', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Mock videos data for now
    const mockVideos = [
      'https://sample-videos.com/zip/10/mp4/480/mp4-sample-1.mp4',
      'https://sample-videos.com/zip/10/mp4/480/mp4-sample-2.mp4'
    ];

    res.json(mockVideos);
  } catch (error) {
    console.error('Get user videos error:', error);
    res.status(500).json({ error: 'Failed to fetch user videos' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Extract allowed update fields
    const {
      name,
      firstName,
      lastName,
      bio,
      location,
      website,
      birthday,
      gender,
      interests,
      languages,
      socialLinks,
      preferences,
      avatar,
      coverImage
    } = req.body;
    
    const updateData: any = {};
    
    // Only update fields that are provided
    if (name !== undefined) updateData.name = name;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (birthday !== undefined) updateData.birthday = birthday;
    if (gender !== undefined) updateData.gender = gender;
    if (interests !== undefined) updateData.interests = interests;
    if (languages !== undefined) updateData.languages = languages;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    if (preferences !== undefined) updateData.preferences = preferences;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (coverImage !== undefined) updateData.coverImage = coverImage;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;